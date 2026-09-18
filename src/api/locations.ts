export type LocationStatus = 'available' | 'captured' | 'locked'

export interface LocationPoint {
  id: number
  name: string
  latitude: number
  longitude: number
  entityId: number
  entityName: string
  status: LocationStatus
  description?: string
  tag?: string
}

// Запасные mock-данные с реальными координатами исторических точек Казани
export const MOCK_LOCATIONS: LocationPoint[] = [
  {
    id: 1,
    name: 'Лесопарк Лебяжье (Дуб Шурале)',
    latitude: 55.7972,
    longitude: 49.1495,
    entityId: 1,
    entityName: 'Шурале',
    status: 'available',
    description: 'Дремучий лес, где вековые дубы хранят тайны лесного духа.',
    tag: 'forest-01',
  },
  {
    id: 2,
    name: 'Озеро Кабан (Обитель Су анасы)',
    latitude: 55.7797,
    longitude: 49.1235,
    entityId: 2,
    entityName: 'Су анасы',
    status: 'available',
    description: 'Таинственные воды озера Кабан, хранящие золотой гребень водяной.',
    tag: 'lake-02',
  },
  {
    id: 3,
    name: 'Башня Сююмбике (Падающая святыня)',
    latitude: 55.8005,
    longitude: 49.1051,
    entityId: 3,
    entityName: 'Башня Сююмбике',
    status: 'available',
    description: 'Семиярусная жемчужина Кремля, символ мудрости и стойкости царицы.',
    tag: 'tower-03',
  },
  {
    id: 4,
    name: 'Казанский Кремль (Белокаменная крепость)',
    latitude: 55.7984,
    longitude: 49.1052,
    entityId: 4,
    entityName: 'Казанский Кремль',
    status: 'available',
    description: 'Древняя цитадель на холме у слияния Волги и Казанки.',
    tag: 'citadel-04',
  },
]

const API_BASE = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, '') ?? ''

/**
 * Получить список всех игровых точек на карте
 */
export async function getLocations(userId?: number): Promise<LocationPoint[]> {
  try {
    const url = API_BASE
      ? `${API_BASE}/api/locations${userId ? `?userId=${userId}` : ''}`
      : `/api/locations${userId ? `?userId=${userId}` : ''}`

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 3000)

    const response = await fetch(url, { signal: controller.signal })
    clearTimeout(timeout)

    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}`)
    }

    const data = (await response.json()) as LocationPoint[]
    if (Array.isArray(data) && data.length > 0) {
      // Сопоставляем tags для перехода к encounter
      return data.map((loc) => {
        const mockMatch = MOCK_LOCATIONS.find((m) => m.id === loc.id || m.entityId === loc.entityId)
        return {
          ...loc,
          tag: mockMatch?.tag ?? (loc.entityId === 1 ? 'forest-01' : loc.entityId === 2 ? 'lake-02' : loc.entityId === 3 ? 'tower-03' : 'citadel-04'),
          description: mockMatch?.description,
        }
      })
    }
  } catch {
    // В случае оффлайн-режима или недоступности API используем качественные mock-данные
  }

  return MOCK_LOCATIONS
}

/**
 * Получить детальную информацию о конкретной точке по ID
 */
export async function getLocation(id: number, userId?: number): Promise<LocationPoint | null> {
  const all = await getLocations(userId)
  return all.find((loc) => loc.id === id) ?? null
}
