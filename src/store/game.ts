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
  run: (
    command: Command,
  ) => Promise<'ready' | 'captured' | 'failed' | undefined>
  clearError: () => void
  resetDemo: () => void
}
let commands = Promise.resolve<unknown>(undefined)
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
      run: (command) => {
        // Polls are expendable; player commands are serialized and never silently dropped.
        if (
          command.type === 'pve' &&
          command.action === 'poll' &&
          !command.input &&
          get().busy
        )
          return Promise.resolve(undefined)
        const task = commands.then(async () => {
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
        })
        commands = task.catch(() => undefined)
        return task
      },
    }),
    {
      name: isCloud ? 'miras-cloud-ui-v1' : 'miras-demo-v2',
      version: 2,
      merge: (persisted, current) => {
        const saved = persisted as Partial<GameStore>
        return {
          ...current,
          ...saved,
          progress: { ...initialProgress(), ...saved.progress },
        }
      },
      partialize: (state) => (isCloud ? {} : { progress: state.progress }),
    },
  ),
)
