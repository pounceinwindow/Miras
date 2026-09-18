import { COOLDOWN_MS, getCharacter, MAX_LEVEL, upgradeCost } from './characters'
import { gradeQuiz } from './quiz'
import { createPve, inputPve, rules, stepPve } from './pve/engine'
import type { Command, GameResult, Progress } from './types'
export function executeDemo(
  input: Progress,
  command: Command,
  now = Date.now(),
  battleId: string = crypto.randomUUID(),
): GameResult {
  const progress = structuredClone(input)
  if (command.type === 'sync') return { progress }
  if (command.type === 'pve') {
    const b = progress.pve
    if (!b || b.id !== command.battleId)
      throw new Error('Этот бой уже завершён или заменён. Обнови страницу.')
    if (b.status !== 'active') return { progress }
    const elapsed = Math.max(0, now - progress.pveUpdatedAt)
    // A hidden tab/disconnection freezes combat, rather than killing the player offline.
    if (elapsed > 1500) b.paused = true
    const ticks = Math.floor(elapsed / rules.tickMs)
    if (!b.paused) {
      stepPve(b, ticks)
      progress.pveUpdatedAt += ticks * rules.tickMs
    } else progress.pveUpdatedAt = now
    if (b.status === 'active') {
      if (command.action === 'abandon') b.status = 'lost'
      if (command.action === 'pause') b.paused = true
      if (command.action === 'resume') {
        b.paused = false
        progress.pveUpdatedAt = now
      }
      if (command.input) inputPve(b, command.input)
    }
    if ((b.status as string) === 'won') {
      progress.balance += rules.reward
      progress.wins++
      if (
        b.mode === 'encounter' &&
        !progress.collection.some((c) => c.id === b.target)
      ) {
        progress.collection.push({
          id: b.target,
          level: 1,
          capturedAt: new Date(now).toISOString(),
        })
        progress.challenges = progress.challenges.filter(
          (id) => id !== b.target,
        )
      }
    }
    return { progress }
  }
  if (command.type === 'startBattle' || command.type === 'battleTurn')
    throw new Error('Пошаговые бои заменены PvE-ареной.')
  const character = getCharacter(command.characterId)
  if (!character) throw new Error('Персонаж не найден')
  const owned = progress.collection.find((c) => c.id === command.characterId)
  if (command.type === 'capture') {
    if (!progress.modes.encounters)
      throw new Error('Встречи временно отключены')
    if (command.tagId !== character.tag)
      throw new Error('Неверная метка встречи')
    if (owned) throw new Error('Персонаж уже в коллекции')
    if (progress.challenges.includes(character.id))
      return { progress, outcome: 'ready' }
    if (Date.parse(progress.cooldowns[character.id] || '') > now)
      throw new Error('Новая попытка будет доступна через сутки после ошибки')
    if (
      command.answers.length !== 3 ||
      command.answers.some((a) => !Number.isInteger(a) || a < 0 || a > 2)
    )
      throw new Error('Ответь на все три вопроса')
    if (gradeQuiz(character.id, command.answers)) {
      progress.challenges.push(character.id)
      delete progress.cooldowns[character.id]
      return { progress, outcome: 'ready' }
    }
    progress.cooldowns[character.id] = new Date(now + COOLDOWN_MS).toISOString()
    return { progress, outcome: 'failed' }
  }
  if (!owned) throw new Error('Сначала пригласи персонажа в коллекцию')
  if (progress.pve?.status === 'active')
    throw new Error('Сначала заверши текущий бой')
  if (command.type === 'upgrade') {
    if (owned.level >= MAX_LEVEL)
      throw new Error('Достигнут максимальный уровень')
    const cost = upgradeCost(owned.level)
    if (progress.balance < cost)
      throw new Error('Недостаточно чак-чака. Победи в поединке!')
    progress.balance -= cost
    owned.level++
  } else if (command.type === 'pveStart') {
    if (!progress.modes.pve) throw new Error('PvE временно отключено')
    if (!getCharacter(command.target)) throw new Error('Соперник не найден')
    if (
      command.mode === 'encounter' &&
      (!progress.modes.encounters ||
        !progress.challenges.includes(command.target) ||
        progress.collection.some((c) => c.id === command.target))
    )
      throw new Error('Открой встречу на точке и ответь на вопросы')
    progress.pve = createPve(
      battleId,
      owned.id,
      owned.level,
      command.target,
      command.mode,
    )
    progress.pveUpdatedAt = now
  }
  return { progress }
}
