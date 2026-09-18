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
  balance: number
  collection: OwnedCharacter[]
  cooldowns: Partial<Record<CharacterId, string>>
  wins: number
  battle: Battle | null
}
export type Command =
  | { type: 'sync' }
  | { type: 'capture'; characterId: CharacterId; answers: number[] }
  | { type: 'upgrade'; characterId: CharacterId }
  | { type: 'startBattle'; characterId: CharacterId }
  | { type: 'battleTurn'; battleId: string; turn: number; action: Action }
export interface GameResult {
  progress: Progress
  outcome?: 'captured' | 'failed'
}
export const initialProgress = (): Progress => ({
  balance: 0,
  collection: [],
  cooldowns: {},
  wins: 0,
  battle: null,
})
