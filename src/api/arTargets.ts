import { supabase } from '../lib/api'
import type { CharacterId } from './types'

export interface ArTarget {
  tag: string
  entityId: CharacterId
  mindPath: string
  latitude: number
  longitude: number
}

const kremlinTarget: ArTarget = {
  tag: 'stone-01',
  entityId: 'kereml',
  mindPath: '/ar/assets/target.mind',
  latitude: 55.79194444444444,
  longitude: 49.102222222222224,
}

export async function getActiveArTarget(): Promise<ArTarget> {
  if (!supabase) return kremlinTarget
  const { data, error } = await supabase
    .from('ar_targets')
    .select('tag, entity_id, mind_path, latitude, longitude')
    .eq('active', true)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (error) {
    if (error.code === 'PGRST205') return kremlinTarget
    throw error
  }
  if (!data) return kremlinTarget
  return {
    tag: data.tag,
    entityId: data.entity_id as CharacterId,
    mindPath: data.mind_path,
    latitude: data.latitude,
    longitude: data.longitude,
  }
}
