import { characters } from '../../shared/characters'
import type { CharacterId, Quiz } from '../api/types'
export const questions = Object.fromEntries(
  characters.map((c) => [c.id, c.questions]),
) as Record<CharacterId, Quiz['questions']>
