import { getEntities } from './entities'
import { request } from './client'
import type { CharacterId, Progress } from './types'
export async function startEncounter(token: string) {
  const entity = (await getEntities()).find((entity) => entity.tag === token)
  if (!entity) throw new Error('Метка не найдена')
  return entity
}
export function captureEncounter(id: CharacterId, progress: Progress) {
  return request({ type: 'capture', characterId: id }, progress)
}

export function imprisonEncounter(id: CharacterId, progress: Progress) {
  return request({ type: 'imprison', characterId: id }, progress)
}
