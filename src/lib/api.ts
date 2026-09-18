import { createClient } from '@supabase/supabase-js'
import type { Command, GameResult } from '../../shared/types'
const apiUrl = (import.meta.env.VITE_API_URL as string | undefined)?.replace(
  /\/$/,
  '',
)
const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY
if (Boolean(url) !== Boolean(key))
  throw new Error(
    'Укажите обе переменные Supabase Auth или оставьте обе пустыми.',
  )
if (url && !apiUrl)
  throw new Error('Для Supabase Auth укажите VITE_API_URL — адрес C# API.')
export const supabase = url && key ? createClient(url, key) : null
export const isCloud = !!apiUrl
let guestPromise: Promise<string> | null = null
async function getToken(): Promise<string> {
  if (supabase) {
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession()
    if (sessionError) throw sessionError
    if (session) return session.access_token
    const { data, error } = await supabase.auth.signInAnonymously()
    if (error || !data.session)
      throw new Error(
        'Не удалось войти. Включите Anonymous Sign-ins в Supabase Auth.',
      )
    return data.session.access_token
  }
  const storageKey = `miras-guest:${apiUrl}`
  const existing = localStorage.getItem(storageKey)
  if (existing) return existing
  if (!guestPromise)
    guestPromise = (async () => {
      const response = await fetch(`${apiUrl}/api/auth/guest`, {
        method: 'POST',
      })
      if (!response.ok)
        throw new Error(
          'Гостевой вход недоступен. Для облака настройте Supabase Auth.',
        )
      const { token } = (await response.json()) as { token: string }
      localStorage.setItem(storageKey, token)
      return token
    })().finally(() => {
      guestPromise = null
    })
  return guestPromise
}
export async function cloudCommand(command: Command): Promise<GameResult> {
  const token = await getToken()
  let response: Response
  try {
    response = await fetch(`${apiUrl}/api/game`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(command),
    })
  } catch {
    throw new Error(
      'C# сервер недоступен. Проверь, что API запущен, и повтори.',
    )
  }
  const data = await response.json().catch(() => null)
  if (!response.ok)
    throw new Error(
      data?.error || `Ошибка сервера (${response.status}). Повтори запрос.`,
    )
  return data as GameResult
}
