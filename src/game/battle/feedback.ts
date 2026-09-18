import type { Battle } from '../../api/types'
export interface BattleFeedback {
  turn: number
  playerDamage: number
  enemyDamage: number
}
export function getBattleFeedback(
  previous: Battle,
  next: Battle,
): BattleFeedback | null {
  if (previous.id !== next.id || next.turn <= previous.turn) return null
  return {
    turn: next.turn,
    playerDamage: Math.max(0, previous.player.hp - next.player.hp),
    enemyDamage: Math.max(0, previous.enemy.hp - next.enemy.hp),
  }
}
