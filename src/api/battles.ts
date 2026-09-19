import { request } from './client'
import type { Action, CharacterId, Progress } from './types'
export { enemyIntent } from '../../shared/battle'
export function startBattle(
  id: CharacterId,
  progress: Progress,
  enemyId?: CharacterId,
) {
  return request({ type: 'startBattle', characterId: id, enemyId }, progress)
}
export function recruitDefeatedEnemy(id: CharacterId, progress: Progress) {
  return request({ type: 'recruit', characterId: id }, progress)
}
export function attack(
  battleId: string,
  turn: number,
  action: Action,
  progress: Progress,
) {
  return request({ type: 'battleTurn', battleId, turn, action }, progress)
}
