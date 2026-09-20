import type { CharacterId } from '../api/types'
import { useGame } from '../store/game'

export async function handleSuccessfulScan(characterId: CharacterId) {
  const starterId: CharacterId = 'su-anasy'
  const state = useGame.getState()

  if (!state.progress.collection.some((item) => item.id === starterId)) {
    await state.run({ type: 'capture', characterId: starterId })
  }

  await useGame.getState().run({ type: 'imprison', characterId })

  return useGame
    .getState()
    .entities.find((entity) => entity.id === characterId)?.tag
}
