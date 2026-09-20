import { mergeMindFiles } from '../../lib/merge-mind-files.js'
import { authenticatedUserId, supabase } from '../lib/api'
import type { CharacterId } from './types'

export interface ArTarget {
  tag: string
  entityId: CharacterId
  mindPath: string
  latitude: number
  longitude: number
  distanceMeters?: number
}

export interface ArTargetManifestItem {
  targetIndex: number
  locationId: string
  entityId: CharacterId
}

export interface ArBundle {
  mind: Blob
  targets: ArTargetManifestItem[]
}

type ArTargetRow = {
  tag: string
  entity_id: string
  mind_path: string
  latitude: number
  longitude: number
  distance_meters?: number
}

export class ArTargetsError extends Error {
  constructor(
    public readonly code: 'NO_TARGETS' | 'TARGET_DOWNLOAD_FAILED',
    message: string,
  ) {
    super(message)
    this.name = 'ArTargetsError'
  }
}

const offlineTargets: ArTarget[] = [
  {
    tag: 'stone-01',
    entityId: 'kereml',
    mindPath: '/ar/assets/target.mind',
    latitude: 55.79194444444444,
    longitude: 49.102222222222224,
  },
]

function mapTarget(row: ArTargetRow): ArTarget {
  return {
    tag: row.tag,
    entityId: row.entity_id as CharacterId,
    mindPath: row.mind_path,
    latitude: Number(row.latitude),
    longitude: Number(row.longitude),
    distanceMeters:
      row.distance_meters === undefined
        ? undefined
        : Number(row.distance_meters),
  }
}

async function queryAllTargets() {
  if (!supabase) return offlineTargets

  await authenticatedUserId()

  const result = await supabase
    .from('ar_targets')
    .select('tag, entity_id, mind_path, latitude, longitude')
    .eq('active', true)
    .order('tag')

  if (result.error) throw result.error
  return (result.data as ArTargetRow[]).map(mapTarget)
}

export async function getArBundle(): Promise<ArBundle> {
  const targets = await queryAllTargets()
  if (targets.length === 0) {
    throw new ArTargetsError('NO_TARGETS', 'Нет доступных AR-меток.')
  }

  const files = await Promise.all(
    targets.map(async (target) => {
      const response = await fetch(target.mindPath)
      if (!response.ok) {
        throw new ArTargetsError(
          'TARGET_DOWNLOAD_FAILED',
          'Не удалось загрузить AR-метку.',
        )
      }
      return {
        locationId: target.tag,
        entityId: target.entityId,
        buffer: new Uint8Array(await response.arrayBuffer()),
      }
    }),
  )

  const merged = mergeMindFiles(files)
  const mindBytes = new Uint8Array(merged.mindBuffer)
  return {
    mind: new Blob([mindBytes.buffer], { type: 'application/octet-stream' }),
    targets: merged.manifest.targets.map((target) => ({
      ...target,
      entityId: target.entityId as CharacterId,
    })),
  }
}
