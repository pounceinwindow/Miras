import {
  getCharacter,
  MAX_LEVEL,
} from './characters.ts'
import { createBattle, takeTurn } from './battle.ts'
import type { Command, GameResult, Progress } from './types.ts'
export function executeDemo(
  input: Progress,
  command: Command,
  now = Date.now(),
  battleId: string = crypto.randomUUID(),
): GameResult {
  const progress = structuredClone(input)
  if (command.type === 'sync') return { progress }
  if (command.type === 'battleTurn') {
    if (
      !progress.battle ||
      progress.battle.id !== command.battleId ||
      progress.battle.turn !== command.turn
    )
      throw new Error('Ход уже обработан. Обнови состояние боя.')
    progress.battle = takeTurn(progress.battle, command.action)
    if (progress.battle.status === 'won') {
      progress.wins += 1
    }
    return { progress }
  }
  if (!getCharacter(command.characterId)) throw new Error('Персонаж не найден')
  const owned = progress.collection.find((c) => c.id === command.characterId)
  if (command.type === 'capture') {
    if (!owned) {
      progress.collection.push({
        id: command.characterId,
        level: 1,
        capturedAt: new Date(now).toISOString(),
      })
    }
    delete progress.cooldowns[command.characterId]
    return { progress, outcome: 'captured' }
  }
  if (!owned) throw new Error('Сначала пригласи персонажа в коллекцию')
  if (command.type === 'upgrade') {
    if (owned.level >= MAX_LEVEL)
      throw new Error('Достигнут максимальный уровень')
    owned.level += 1
  } else {
    if (progress.battle?.status === 'active')
      throw new Error('Сначала заверши текущий бой')
    progress.battle = createBattle(
      battleId,
      owned.id,
      owned.level,
      command.enemyId,
    )
  }
  return { progress }
}
