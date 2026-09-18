import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { initialProgress } from '../../shared/types'
import type { Command, Progress } from '../../shared/types'
import { cloudCommand, isCloud } from '../lib/api'
interface GameStore {
  progress: Progress
  busy: boolean
  error: string | null
  ready: boolean
  run: (command: Command) => Promise<'captured' | 'failed' | undefined>
  clearError: () => void
  resetDemo: () => void
}
export const useGame = create<GameStore>()(
  persist(
    (set, get) => ({
      progress: initialProgress(),
      busy: false,
      error: null,
      ready: !isCloud,
      clearError: () => set({ error: null }),
      resetDemo: () => {
        if (!isCloud && !get().busy)
          set({ progress: initialProgress(), error: null })
      },
      run: async (command) => {
        if (get().busy) return
        set({ busy: true, error: null })
        try {
          const result = isCloud
            ? await cloudCommand(command)
            : (await import('../../shared/demo')).executeDemo(
                get().progress,
                command,
              )
          set({ progress: result.progress, ready: true })
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
