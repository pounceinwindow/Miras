import type { CharacterId } from './types.ts'
// Demo uses the same key locally. Cloud validates answers in the Edge Function.
const keys: Record<CharacterId, number[]> = {
  shurale: [0, 1, 2],
  syuyumbike: [1, 0, 2],
  'su-anasy': [1, 2, 0],
  kereml: [1, 0, 2],
}
export function gradeQuiz(id: CharacterId, answers: number[]): boolean {
  return (
    !!keys[id] &&
    answers.length === 3 &&
    answers.every(
      (answer, index) => Number.isInteger(answer) && answer === keys[id][index],
    )
  )
}
