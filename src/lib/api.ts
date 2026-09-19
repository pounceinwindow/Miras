import { createClient } from '@supabase/supabase-js'
import { executeDemo } from '../../shared/demo'
import { initialProgress } from '../../shared/types'
import type { Command, GameResult, Progress } from '../../shared/types'

const url =
  import.meta.env.MODE === 'test'
    ? undefined
    : (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.trim()
const key =
  import.meta.env.MODE === 'test'
    ? undefined
    : (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined)?.trim()

if (Boolean(url) !== Boolean(key))
  throw new Error(
    'Укажите обе переменные Supabase или оставьте обе пустыми для локального режима.',
  )

export const supabase = url && key ? createClient(url, key) : null
export const isCloud = supabase !== null

export async function authenticatedUserId(): Promise<string> {
  if (!supabase) throw new Error('Supabase не настроен')
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession()
  if (sessionError) throw sessionError
  if (session) return session.user.id

  const { data, error } = await supabase.auth.signInAnonymously()
  if (error || !data.user)
    throw new Error(
      'Не удалось создать профиль. Включи Anonymous Sign-ins в Supabase Auth.',
    )
  return data.user.id
}

async function readProgress(userId: string): Promise<Progress> {
  if (!supabase) return initialProgress()
  const { data, error } = await supabase
    .from('game_progress')
    .select('progress')
    .eq('user_id', userId)
    .maybeSingle()
  if (error) throw error
  return data?.progress ? (data.progress as Progress) : initialProgress()
}

async function writeProgress(userId: string, progress: Progress) {
  if (!supabase) return
  const { error } = await supabase.from('game_progress').upsert({
    user_id: userId,
    progress,
    updated_at: new Date().toISOString(),
  })
  if (error) throw error
}

export async function cloudCommand(command: Command): Promise<GameResult> {
  const userId = await authenticatedUserId()
  const current = await readProgress(userId)
  const result = executeDemo(current, command)
  if (command.type !== 'sync') await writeProgress(userId, result.progress)
  return result
}
