import type { CharacterId } from '../../shared/types'
export type {
  Action,
  Battle,
  CharacterId,
  Command,
  Fighter,
  Progress,
  GameResult,
} from '../../shared/types'
export interface Entity {
  id: CharacterId
  name: string
  imageUrl: string
  tatar: string
  title: string
  element: string
  color: string
  location: string
  tag: string
  kind: string
  description: string
  story: string[]
  source: { label: string; url: string }
  level: number
  hp: number
  attack: number
  defense: number
  ability: { name: string; description: string }
  nextUpgradeCost: number | null
  quiz: {
    question: string
    options: string[]
    correctIndex: number
  }[]
  voice?: {
    card?: CharacterLine
    challenge: CharacterLine
    defeat: CharacterLine
  }
}

export interface CharacterLine {
  tatar: string
  russian: string
}
