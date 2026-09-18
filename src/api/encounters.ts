import { getEntities, getEntity } from './entities'
import { questions } from '../mocks/questions'
import { request } from './client'
import type { CharacterId, Progress, Quiz } from './types'
export async function startEncounter(token: string) {
  const entity = (await getEntities()).find((entity) => entity.tag === token)
  if (!entity) throw new Error('Метка не найдена')
  return entity
}
export async function getQuiz(id: string): Promise<Quiz> {
  const entity = await getEntity(id)
  return { entity, questions: structuredClone(questions[entity.id]) }
}
export function submitQuiz(
  id: CharacterId,
  answers: number[],
  progress: Progress,
) {
  return request({ type: 'capture', characterId: id, answers }, progress)
}
