import { getCharacter } from './characters.ts'
import type { Action, Battle, CharacterId, Fighter } from './types.ts'
export const WIN_REWARD = 25
export const enemyIntent = (turn: number): Action =>
  turn % 3 === 0 ? 'skill' : turn % 3 === 2 ? 'guard' : 'attack'
function fighter(id: CharacterId, level: number): Fighter {
  const character = getCharacter(id)
  if (!character || !Number.isInteger(level) || level < 1 || level > 10)
    throw new Error('Некорректный персонаж')
  const hp = character.health + (level - 1) * 12
  return { id, level, hp, maxHp: hp, energy: 2 }
}
export function createBattle(
  id: string,
  characterId: CharacterId,
  level: number,
  enemyIdOverride?: CharacterId,
): Battle {
  const enemyId =
    enemyIdOverride && enemyIdOverride !== characterId
      ? enemyIdOverride
      : characterId === 'shurale'
        ? 'kereml'
        : 'shurale'
  return {
    id,
    player: fighter(characterId, level),
    enemy: fighter(enemyId, level),
    turn: 1,
    status: 'active',
    log: ['Тренировочный поединок начался. Первый ход за тобой.'],
  }
}
export function takeTurn(input: Battle, action: Action): Battle {
  if (input.status !== 'active') throw new Error('Бой уже завершён')
  if (!['attack', 'guard', 'skill'].includes(action))
    throw new Error('Неизвестный приём')
  if (action === 'skill' && input.player.energy < 3)
    throw new Error('Для приёма нужно 3 энергии')
  const battle: Battle = structuredClone(input)
  const { player, enemy } = battle
  const intent = enemyIntent(battle.turn)
  const damage = (f: Fighter) => getCharacter(f.id)!.attack + (f.level - 1) * 3
  const log: string[] = []
  if (action === 'guard') {
    player.energy = Math.min(5, player.energy + 1)
    log.push('Ты защищаешься и восстанавливаешь энергию.')
  } else {
    const hit = Math.round(
      damage(player) *
        (action === 'skill' ? 2 : 1) *
        (intent === 'guard' ? 0.4 : 1),
    )
    enemy.hp = Math.max(0, enemy.hp - hit)
    player.energy =
      action === 'skill' ? player.energy - 3 : Math.min(5, player.energy + 1)
    log.push(
      `${action === 'skill' ? getCharacter(player.id)!.skill : 'Твоя атака'}: −${hit} здоровья сопернику.`,
    )
  }
  if (enemy.hp === 0) {
    battle.status = 'won'
    log.push('Победа! Хранитель усмирён.')
  } else if (intent !== 'guard') {
    const hit = Math.round(
      damage(enemy) *
        (intent === 'skill' ? 1.8 : 1) *
        (action === 'guard' ? 0.3 : 1),
    )
    player.hp = Math.max(0, player.hp - hit)
    log.push(
      `${intent === 'skill' ? 'Особый приём соперника' : 'Атака соперника'}: −${hit} здоровья.`,
    )
    if (player.hp === 0) {
      battle.status = 'lost'
      log.push('В этот раз победил соперник. Попробуй другую тактику!')
    }
  } else log.push('Соперник защищается и пропускает атаку.')
  battle.turn += 1
  // A bounded match prevents indefinite guard-only sessions.
  if (battle.turn > 40 && battle.status === 'active') {
    battle.status = 'lost'
    log.push('Время поединка вышло.')
  }
  battle.log = [...battle.log, ...log].slice(-12)
  return battle
}
