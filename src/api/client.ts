import type { Command, GameResult, Progress } from './types'
import { cloudCommand, isCloud } from '../lib/api'
export { isCloud } from '../lib/api'
// Only this transport knows whether a command uses local state or the C# API.
export async function request(
  command: Command,
  progress: Progress,
): Promise<GameResult> {
  if (isCloud) return cloudCommand(command)
  const { executeDemo } = await import('../../shared/demo')
  return executeDemo(progress, command)
}
