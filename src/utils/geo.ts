/**
 * Конфигурация радиуса взаимодействия с точкой (в метрах)
 */
export const INTERACTION_RADIUS = 100

export interface GeoPoint {
  latitude: number
  longitude: number
}

/**
 * Вычисляет расстояние между двумя координатами по формуле Haversine (в метрах)
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371e3 // Радиус Земли в метрах
  const phi1 = (lat1 * Math.PI) / 180
  const phi2 = (lat2 * Math.PI) / 180
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) *
      Math.cos(phi2) *
      Math.sin(deltaLambda / 2) *
      Math.sin(deltaLambda / 2)

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return Math.round(R * c)
}

/**
 * Форматирует расстояние в человекочитаемый вид («75 м» или «1.4 км»)
 */
export function formatDistance(meters: number | null | undefined): string {
  if (meters === null || meters === undefined || isNaN(meters)) {
    return 'Расстояние неизвестно'
  }
  if (meters < 1000) {
    return `${Math.round(meters)} м`
  }
  const km = (Math.round(meters / 100) / 10).toFixed(1)
  return `${km} км`
}

/**
 * Проверяет, находится ли игрок достаточно близко к точке для взаимодействия
 */
export function isPlayerNearLocation(
  playerPosition: GeoPoint | null | undefined,
  locationPosition: GeoPoint,
  radius: number = INTERACTION_RADIUS,
): boolean {
  if (!playerPosition) return false
  const distance = calculateDistance(
    playerPosition.latitude,
    playerPosition.longitude,
    locationPosition.latitude,
    locationPosition.longitude,
  )
  return distance <= radius
}
