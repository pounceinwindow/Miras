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
    name: 'Легенда Шурале',
    latitude: 55.7972,
    longitude: 49.1495,
    entityId: 1,
    entityName: 'Шурале',
    status: 'available',
    description: 'Демонстрационная точка знакомства с лесным хранителем.',
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
    description:
      'Таинственные воды озера Кабан, хранящие золотой гребень водяной.',
    tag: 'water-01',
  },
  {
    id: 3,
    name: 'Башня Сююмбике (Падающая святыня)',
    latitude: 55.8005,
    longitude: 49.1051,
    entityId: 3,
    entityName: 'Башня Сююмбике',
    status: 'available',
    description:
      'Семиярусная жемчужина Кремля, символ мудрости и стойкости царицы.',
    tag: 'tower-01',
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
    tag: 'stone-01',
  },
]

// This repository uses the game-command API, not the separate locations backend.
// Keep the supplied module's local catalogue available in both modes.
export async function getLocations(): Promise<LocationPoint[]> {
  return MOCK_LOCATIONS.map((location) => ({ ...location }))
}
