import type { PveBattle, PveInput } from './pve/engine'
export type CharacterId = 'shurale' | 'syuyumbike' | 'su-anasy' | 'kereml'
export type Action = 'attack' | 'guard' | 'skill'
export interface OwnedCharacter {
  id: CharacterId
  level: number
  capturedAt: string
}
export interface Fighter {
  id: CharacterId
  level: number
  hp: number
  maxHp: number
  energy: number
}
export interface Battle {
  id: string
  player: Fighter
  enemy: Fighter
  turn: number
  status: 'active' | 'won' | 'lost'
  log: string[]
}
export interface Progress {
  collection: OwnedCharacter[]
  cooldowns: Partial<Record<CharacterId, string>>
  wins: number
  battle: Battle | null
  pve: PveBattle | null
  pveUpdatedAt: number
  challenges: CharacterId[]
  modes: { pve: boolean; encounters: boolean; pvp: false }
}
export type Command =
  | { type: 'sync' }
  | {
      type: 'pveStart'
      characterId: CharacterId
      party?: CharacterId[]
      target: CharacterId
      mode: 'training' | 'encounter'
      tagId?: string
    }
  | {
      type: 'pve'
      battleId: string
      action: 'poll' | 'resume' | 'pause' | 'abandon'
      input?: PveInput
    }
  | {
      type: 'capture'
      characterId: CharacterId
      tagId: string
      answers: number[]
    }
  | { type: 'startBattle'; characterId: CharacterId }
  | { type: 'battleTurn'; battleId: string; turn: number; action: Action }
export interface GameResult {
  progress: Progress
  outcome?: 'ready' | 'captured' | 'failed'
}
export const initialProgress = (): Progress => ({
  collection: [
    { id: 'su-anasy', level: 1, capturedAt: new Date().toISOString() },
  ],
  cooldowns: {},
  wins: 0,
  battle: null,
  pve: null,
  pveUpdatedAt: 0,
  challenges: [],
  modes: { pve: true, encounters: true, pvp: false },
})
