import { describe, it, expect } from 'vitest'
import {
  calculateDistance,
  formatDistance,
  isPlayerNearLocation,
  INTERACTION_RADIUS,
} from '../../src/utils/geo'

describe('geo utilities', () => {
  it('calculateDistance returns 0 for identical points', () => {
    expect(calculateDistance(55.7984, 49.1052, 55.7984, 49.1052)).toBe(0)
  })

  it('calculateDistance returns accurate distance in meters between Kremlin and Suyumbike (~230m)', () => {
    // Кремль: 55.7984, 49.1052
    // Сююмбике: 55.8005, 49.1051
    const dist = calculateDistance(55.7984, 49.1052, 55.8005, 49.1051)
    expect(dist).toBeGreaterThan(200)
    expect(dist).toBeLessThan(260)
  })

  it('formatDistance formats meters and kilometers properly', () => {
    expect(formatDistance(75)).toBe('75 м')
    expect(formatDistance(999)).toBe('999 м')
    expect(formatDistance(1000)).toBe('1.0 км')
    expect(formatDistance(1450)).toBe('1.5 км')
    expect(formatDistance(null)).toBe('Расстояние неизвестно')
  })

  it('isPlayerNearLocation respects INTERACTION_RADIUS', () => {
    const loc = { latitude: 55.7984, longitude: 49.1052 }

    // Точка в 30 метрах
    const near = { latitude: 55.7986, longitude: 49.1054 }
    expect(isPlayerNearLocation(near, loc)).toBe(true)

    // Точка в 500 метрах
    const far = { latitude: 55.803, longitude: 49.11 }
    expect(isPlayerNearLocation(far, loc)).toBe(false)

    // Без координат игрока
    expect(isPlayerNearLocation(null, loc)).toBe(false)
  })

  it('INTERACTION_RADIUS equals 100 meters by default', () => {
    expect(INTERACTION_RADIUS).toBe(100)
  })
})
