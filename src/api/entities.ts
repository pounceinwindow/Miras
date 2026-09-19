import { entities } from '../mocks/entities'
import type { CharacterId, Entity, Progress } from './types'
import { request } from './client'
export async function getEntities(progress?: Progress): Promise<Entity[]> {
  return entities.map((entity) => {
    const level =
      progress?.collection.find((c) => c.id === entity.id)?.level ?? 1
    return structuredClone({
      ...entity,
      level,
      hp: entity.hp + (level - 1) * 12,
      attack: entity.attack + (level - 1) * 3,
      nextUpgradeCost: level < 10 ? level * 30 : null,
    })
  })
}
export async function getEntity(
  id: string,
  progress?: Progress,
): Promise<Entity> {
  const entity = (await getEntities(progress)).find(
    (entity) => entity.id === id,
  )
  if (!entity) throw new Error('Хранитель не найден')
  return entity
}
export function upgradeEntity(id: CharacterId, progress: Progress) {
  return request({ type: 'upgrade', characterId: id }, progress)
}
