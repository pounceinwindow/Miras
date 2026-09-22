import { supabase } from './api'

export type AnalyticsEventName =
  | 'screen_view'
  | 'location_selected'
  | 'story_opened'
  | 'battle_started'
  | 'battle_finished'
  | 'pvp_opened'

interface QueuedEvent {
  id: string
  event_name: AnalyticsEventName
  properties: Record<string, string | number | boolean | null>
  occurred_at: string
}

const storageKey = 'miras-analytics-queue'

function createId() {
  if (typeof crypto?.randomUUID === 'function') return crypto.randomUUID()
  const bytes = new Uint8Array(16)
  crypto?.getRandomValues?.(bytes)
  bytes[6] = (bytes[6] & 0x0f) | 0x40
  bytes[8] = (bytes[8] & 0x3f) | 0x80
  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0'))
  return `${hex.slice(0, 4).join('')}-${hex.slice(4, 6).join('')}-${hex.slice(6, 8).join('')}-${hex.slice(8, 10).join('')}-${hex.slice(10).join('')}`
}

function readQueue(): QueuedEvent[] {
  try {
    return JSON.parse(localStorage.getItem(storageKey) ?? '[]') as QueuedEvent[]
  } catch {
    return []
  }
}

function writeQueue(events: QueuedEvent[]) {
  localStorage.setItem(storageKey, JSON.stringify(events.slice(-100)))
}

export function trackEvent(
  eventName: AnalyticsEventName,
  properties: QueuedEvent['properties'] = {},
) {
  if (typeof window === 'undefined') return
  writeQueue([
    ...readQueue(),
    {
      id: createId(),
      event_name: eventName,
      properties,
      occurred_at: new Date().toISOString(),
    },
  ])
  void flushAnalytics()
}

export async function flushAnalytics() {
  if (!supabase || typeof window === 'undefined') return
  const queue = readQueue()
  if (queue.length === 0) return
  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (!session) return
  const { error } = await supabase.from('analytics_events').insert(
    queue.map((event) => ({
      ...event,
      user_id: session.user.id,
    })),
  )
  if (!error) writeQueue([])
}
