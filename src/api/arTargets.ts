import { mergeMindFiles } from '../../lib/merge-mind-files.js'
import { authenticatedUserId, supabase } from '../lib/api'
import { calculateDistance, INTERACTION_RADIUS } from '../utils/geo'
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

export class NearbyArTargetsError extends Error {
  constructor(
    public readonly code: 'NO_NEARBY_TARGETS' | 'TARGET_DOWNLOAD_FAILED',
    message: string,
  ) {
    super(message)
    this.name = 'NearbyArTargetsError'
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

function withinRadius(
  targets: ArTarget[],
  latitude: number,
  longitude: number,
) {
  return targets
    .map((target) => ({
      ...target,
      distanceMeters: calculateDistance(
        latitude,
        longitude,
        target.latitude,
        target.longitude,
      ),
    }))
    .filter((target) => target.distanceMeters <= INTERACTION_RADIUS)
    .sort((a, b) => a.distanceMeters - b.distanceMeters)
}

async function queryNearbyTargets(latitude: number, longitude: number) {
  if (!supabase) return withinRadius(offlineTargets, latitude, longitude)

  await authenticatedUserId()

  // Preferred path: the database itself returns only targets within 100 m.
  const { data, error } = await supabase.rpc('nearby_ar_targets', {
    player_lat: latitude,
    player_lon: longitude,
    radius_meters: INTERACTION_RADIUS,
  })
  if (!error) return (data as ArTargetRow[]).map(mapTarget)

  // Keeps the current deployment working until the SQL migration is applied:
  // request only a 100 m bounding box, then apply exact Haversine distance.
  const latitudeDelta = INTERACTION_RADIUS / 111_320
  const longitudeDelta =
    INTERACTION_RADIUS /
    (111_320 * Math.max(Math.cos((latitude * Math.PI) / 180), 0.01))
  const fallback = await supabase
    .from('ar_targets')
    .select('tag, entity_id, mind_path, latitude, longitude')
    .eq('active', true)
    .gte('latitude', latitude - latitudeDelta)
    .lte('latitude', latitude + latitudeDelta)
    .gte('longitude', longitude - longitudeDelta)
    .lte('longitude', longitude + longitudeDelta)

  if (fallback.error) throw fallback.error
  return withinRadius(
    (fallback.data as ArTargetRow[]).map(mapTarget),
    latitude,
    longitude,
  )
}

export async function getNearbyArBundle(
  latitude: number,
  longitude: number,
): Promise<ArBundle> {
  const targets = await queryNearbyTargets(latitude, longitude)
  if (targets.length === 0) {
    throw new NearbyArTargetsError(
      'NO_NEARBY_TARGETS',
      'В радиусе 100 м нет доступных AR-меток.',
    )
  }

  const files = await Promise.all(
    targets.map(async (target) => {
      const response = await fetch(target.mindPath)
      if (!response.ok) {
        throw new NearbyArTargetsError(
          'TARGET_DOWNLOAD_FAILED',
          'Не удалось загрузить ближайшую AR-метку.',
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
