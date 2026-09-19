import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { getInitialProgress as initialProgress, getUser } from '../api/user'
import { getEntities, upgradeEntity } from '../api/entities'
import { captureEncounter, imprisonEncounter } from '../api/encounters'
import { startBattle, attack, recruitDefeatedEnemy } from '../api/battles'
import type { Entity } from '../api/types'
import type { Command, Progress } from '../api/types'
import { isCloud } from '../api/client'
interface GameStore {
  entities: Entity[]
  progress: Progress
  busy: boolean
  error: string | null
  ready: boolean
  run: (
    command: Command,
  ) => Promise<'captured' | 'imprisoned' | 'recruited' | undefined>
  clearError: () => void
  resetDemo: () => void
}
export const useGame = create<GameStore>()(
  persist(
    (set, get) => ({
      entities: [],
      progress: initialProgress(),
      busy: false,
      error: null,
      ready: false,
      clearError: () => set({ error: null }),
      resetDemo: () => {
        if (!isCloud && !get().busy) {
          set({ progress: initialProgress(), error: null })
          void get().run({ type: 'sync' })
        }
      },
      run: async (command) => {
        if (get().busy) return
        set({ busy: true, error: null })
        try {
          const progress = get().progress
          const result = await (command.type === 'sync'
            ? getUser(progress)
            : command.type === 'capture'
              ? captureEncounter(command.characterId, progress)
              : command.type === 'imprison'
                ? imprisonEncounter(command.characterId, progress)
                : command.type === 'recruit'
                  ? recruitDefeatedEnemy(command.characterId, progress)
                  : command.type === 'upgrade'
                    ? upgradeEntity(command.characterId, progress)
                    : command.type === 'startBattle'
                      ? startBattle(
                          command.characterId,
                          progress,
                          command.enemyId,
                        )
                      : attack(
                          command.battleId,
                          command.turn,
                          command.action,
                          progress,
                        ))
          const entities = await getEntities(result.progress)
          set({ progress: result.progress, entities, ready: true })
          return result.outcome
        } catch (error) {
          set({
            error:
              error instanceof Error
                ? error.message
                : 'Не удалось выполнить действие',
          })
        } finally {
          set({ busy: false })
        }
      },
    }),
    {
      name: isCloud ? 'miras-cloud-ui-v1' : 'miras-demo-v1',
      partialize: (state) => (isCloud ? {} : { progress: state.progress }),
    },
  ),
)
