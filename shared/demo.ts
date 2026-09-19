import { getCharacter, MAX_LEVEL } from './characters.ts'
import { createBattle, takeTurn } from './battle.ts'
import type {
  CharacterId,
  Command,
  GameResult,
  OwnedCharacter,
  Progress,
} from './types.ts'

function createBattleId() {
  const webCrypto = globalThis.crypto
  if (typeof webCrypto?.randomUUID === 'function') {
    return webCrypto.randomUUID()
  }

  const bytes = new Uint8Array(16)
  if (typeof webCrypto?.getRandomValues === 'function') {
    webCrypto.getRandomValues(bytes)
  } else {
    for (let index = 0; index < bytes.length; index += 1) {
      bytes[index] = Math.floor(Math.random() * 256)
    }
  }
  bytes[6] = (bytes[6] & 0x0f) | 0x40
  bytes[8] = (bytes[8] & 0x3f) | 0x80
  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0'))
  return `${hex.slice(0, 4).join('')}-${hex.slice(4, 6).join('')}-${hex.slice(6, 8).join('')}-${hex.slice(8, 10).join('')}-${hex.slice(10).join('')}`
}

const starterCharacter = (): OwnedCharacter => ({
  id: 'su-anasy',
  level: 1,
  capturedAt: new Date(0).toISOString(),
})

export function normalizeProgress(input: Progress): Progress {
  const progress = structuredClone(input)
  progress.collection = Array.isArray(progress.collection)
    ? progress.collection
    : []
  progress.captives = Array.isArray(progress.captives) ? progress.captives : []

  if (!progress.collection.some((item) => item.id === 'su-anasy')) {
    progress.collection.unshift(starterCharacter())
  }

  const captiveIds = new Set<CharacterId>(
    progress.captives.filter((id) => id !== 'su-anasy'),
  )
  const seenOwned = new Set<CharacterId>()
  progress.collection = progress.collection.filter((item) => {
    if (seenOwned.has(item.id)) return false
    seenOwned.add(item.id)
    return item.id === 'su-anasy' || !captiveIds.has(item.id)
  })
  progress.captives = [...captiveIds]
  return progress
}

export function executeDemo(
  input: Progress,
  command: Command,
  now = Date.now(),
  battleId?: string,
): GameResult {
  const progress = normalizeProgress(input)
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
  if (command.type === 'imprison') {
    if (!owned && !progress.captives!.includes(command.characterId)) {
      progress.captives!.push(command.characterId)
    }
    return { progress, outcome: 'imprisoned' }
  }
  if (command.type === 'recruit') {
    progress.battle = null
    progress.captives = progress.captives!.filter(
      (id) => id !== command.characterId,
    )
    if (!owned) {
      progress.collection.push({
        id: command.characterId,
        level: 1,
        capturedAt: new Date(now).toISOString(),
      })
      progress.wins += 1
    }
    return { progress, outcome: 'recruited' }
  }
  if (command.type === 'capture') {
    if (!owned) {
      progress.collection.push({
        id: command.characterId,
        level: 1,
        capturedAt: new Date(now).toISOString(),
      })
    }
    progress.captives = progress.captives!.filter(
      (id) => id !== command.characterId,
    )
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
      battleId ?? createBattleId(),
      owned.id,
      owned.level,
      command.enemyId,
    )
  }
  return { progress }
}
