import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import {
  MapPin,
  Navigation,
  Compass,
  Sparkles,
  Check,
  Lock,
  ArrowRight,
  AlertCircle,
  Footprints,
  Maximize2,
  Minimize2,
} from 'lucide-react'
import { getLocations, type LocationPoint } from '../api/locations'
import {
  calculateDistance,
  formatDistance,
  INTERACTION_RADIUS,
  type GeoPoint,
} from '../utils/geo'
import { useGame } from '../store/game'

// Координаты центра Казани и Татарстана
const KAZAN_CENTER: [number, number] = [55.796, 49.11]
const TATARSTAN_CENTER: [number, number] = [55.3, 50.7]

export default function MapPage() {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<L.Map | null>(null)
  const playerMarkerRef = useRef<L.Marker | null>(null)
  const pointsLayerRef = useRef<L.LayerGroup | null>(null)

  const collection = useGame((s) => s.progress.collection)

  const [locations, setLocations] = useState<LocationPoint[]>([])
  const [selectedLocation, setSelectedLocation] = useState<LocationPoint | null>(null)
  const [playerPosition, setPlayerPosition] = useState<GeoPoint | null>(null)
  const [geoError, setGeoError] = useState<string | null>(() =>
    typeof navigator !== 'undefined' && !navigator.geolocation
      ? 'Геолокация не поддерживается вашим браузером.'
      : null,
  )
  const [isSimulating, setIsSimulating] = useState(false)
  const [loadingLocations, setLoadingLocations] = useState(true)

  // 1. Загрузка точек через API-слой
  useEffect(() => {
    let active = true
    async function load() {
      setLoadingLocations(true)
      try {
        const data = await getLocations()
        if (active) {
          // Актуализируем статус на основе коллекции игрока
          const updated = data.map((loc) => {
            const isCaptured = collection.some(
              (c) =>
                c.id === loc.tag ||
                (loc.entityId === 1 && c.id === 'shurale') ||
                (loc.entityId === 2 && c.id === 'su-anasy') ||
                (loc.entityId === 3 && c.id === 'syuyumbike') ||
                (loc.entityId === 4 && c.id === 'kereml'),
            )
            return {
              ...loc,
              status: isCaptured ? ('captured' as const) : loc.status,
            }
          })
          setLocations(updated)
        }
      } finally {
        if (active) setLoadingLocations(false)
      }
    }
    void load()
    return () => {
      active = false
    }
  }, [collection])

  // 2. Инициализация карты Leaflet
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return

    // Начальный масштаб — уровень города Казань (zoom 13), минимум 6 (весь Татарстан), максимум 18
    const map = L.map(mapContainerRef.current, {
      center: KAZAN_CENTER,
      zoom: 13,
      minZoom: 6,
      maxZoom: 18,
      zoomControl: false,
    })

    // Красивые и быстрые тайлы OpenStreetMap / CARTO Positron
    L.tileLayer(
      'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
      {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 19,
      },
    ).addTo(map)

    const pointsGroup = L.layerGroup().addTo(map)
    pointsLayerRef.current = pointsGroup
    mapInstanceRef.current = map

    return () => {
      map.remove()
      mapInstanceRef.current = null
    }
  }, [])

  // 3. Отслеживание геолокации игрока
  useEffect(() => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      return
    }

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const coords: GeoPoint = {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        }
        setPlayerPosition(coords)
        setGeoError(null)
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
          setGeoError('Доступ к геолокации запрещён в браузере. Вы можете включить симуляцию для теста.')
        } else {
          setGeoError('Не удалось определить координаты GPS.')
        }
      },
      {
        enableHighAccuracy: true,
        maximumAge: 5000,
        timeout: 10000,
      },
    )

    return () => {
      navigator.geolocation.clearWatch(watchId)
    }
  }, [])

  // 4. Отрисовка маркера игрока на карте
  useEffect(() => {
    const map = mapInstanceRef.current
    if (!map || !playerPosition) return

    const playerIcon = L.divIcon({
      className: 'player-marker-icon',
      html: `
        <div class="player-dot-wrapper">
          <div class="player-dot-pulse"></div>
          <div class="player-dot-core"></div>
        </div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 16],
    })

    if (playerMarkerRef.current) {
      playerMarkerRef.current.setLatLng([
        playerPosition.latitude,
        playerPosition.longitude,
      ])
    } else {
      playerMarkerRef.current = L.marker(
        [playerPosition.latitude, playerPosition.longitude],
        { icon: playerIcon, zIndexOffset: 1000 },
      ).addTo(map)
    }
  }, [playerPosition])

  // 5. Отрисовка маркеров игровых точек
  useEffect(() => {
    const map = mapInstanceRef.current
    const group = pointsLayerRef.current
    if (!map || !group) return

    group.clearLayers()

    locations.forEach((loc) => {
      const isCaptured = loc.status === 'captured'
      const isLocked = loc.status === 'locked'

      const markerHtml = `
        <div class="game-pin pin-${loc.status} ${selectedLocation?.id === loc.id ? 'pin-active' : ''}">
          <div class="pin-halo"></div>
          <div class="pin-badge">
            ${isCaptured ? '✓' : isLocked ? '🔒' : '✦'}
          </div>
          <div class="pin-label">${loc.entityName}</div>
        </div>
      `

      const customIcon = L.divIcon({
        className: 'custom-game-marker',
        html: markerHtml,
        iconSize: [44, 44],
        iconAnchor: [22, 40],
      })

      const marker = L.marker([loc.latitude, loc.longitude], {
        icon: customIcon,
      })

      marker.on('click', () => {
        setSelectedLocation(loc)
        map.panTo([loc.latitude, loc.longitude], { animate: true })
      })

      group.addLayer(marker)
    })
  }, [locations, selectedLocation])

  // Управление масштабом и центрированием
  const handleZoomIn = () => mapInstanceRef.current?.zoomIn()
  const handleZoomOut = () => mapInstanceRef.current?.zoomOut()

  const handleCenterOnPlayer = () => {
    if (playerPosition && mapInstanceRef.current) {
      mapInstanceRef.current.setView(
        [playerPosition.latitude, playerPosition.longitude],
        15,
        { animate: true },
      )
    } else {
      handleSimulateNearKremlin()
    }
  }

  const handleShowKazan = () => {
    mapInstanceRef.current?.setView(KAZAN_CENTER, 13, { animate: true })
  }

  const handleShowTatarstan = () => {
    mapInstanceRef.current?.setView(TATARSTAN_CENTER, 7, { animate: true })
  }

  // Функция для удобного тестирования/жюри (симуляция нахождения у Кремля)
  const handleSimulateNearKremlin = () => {
    const simulated: GeoPoint = {
      latitude: 55.7986, // ~30 метров от Казанского Кремля
      longitude: 49.1054,
    }
    setPlayerPosition(simulated)
    setIsSimulating(true)
    setGeoError(null)
    mapInstanceRef.current?.setView([simulated.latitude, simulated.longitude], 16, {
      animate: true,
    })
  }

  // Расчёт расстояния до выбранной точки
  const distanceToSelected =
    selectedLocation && playerPosition
      ? calculateDistance(
          playerPosition.latitude,
          playerPosition.longitude,
          selectedLocation.latitude,
          selectedLocation.longitude,
        )
      : null

  const isNearby = distanceToSelected !== null && distanceToSelected <= INTERACTION_RADIUS

  return (
    <div className="map-page-wrapper">
      {/* Верхний статус-бар */}
      <div className="map-header-bar">
        <div className="map-header-title">
          <Compass size={20} className="header-icon" />
          <span>Карта хранителей Татарстана</span>
        </div>
        <div className="map-header-actions">
          <button
            onClick={handleShowKazan}
            className="map-pill-btn"
            title="Центр Казани"
          >
            Казань
          </button>
          <button
            onClick={handleShowTatarstan}
            className="map-pill-btn"
            title="Масштаб Татарстана"
          >
            Татарстан
          </button>
        </div>
      </div>

      {/* Предупреждение о геолокации, если доступ не дан */}
      {geoError && (
        <div className="map-geo-warning">
          <AlertCircle size={17} />
          <span>{geoError}</span>
          <button onClick={handleSimulateNearKremlin} className="geo-sim-btn">
            Я у Кремля (тест)
          </button>
        </div>
      )}

      {isSimulating && (
        <div className="map-sim-notice">
          <Footprints size={15} />
          <span>Включён режим симуляции: вы у Казанского Кремля (GPS: 55.7986, 49.1054)</span>
        </div>
      )}

      {/* Контейнер интерактивной карты Leaflet */}
      <div className="map-canvas-container" ref={mapContainerRef} />

      {/* Плавающие кнопки управления картой */}
      <div className="map-floating-controls">
        <button
          onClick={handleZoomIn}
          className="map-control-btn"
          aria-label="Приблизить"
          title="Приблизить"
        >
          <Maximize2 size={18} />
        </button>
        <button
          onClick={handleZoomOut}
          className="map-control-btn"
          aria-label="Отдалить"
          title="Отдалить до Татарстана"
        >
          <Minimize2 size={18} />
        </button>
        <button
          onClick={handleCenterOnPlayer}
          className={`map-control-btn ${playerPosition ? 'active' : ''}`}
          aria-label="Мое местоположение"
          title={playerPosition ? 'Моя геопозиция' : 'Включить геопозицию'}
        >
          <Navigation size={18} />
        </button>
      </div>

      {/* Индикатор количества доступных точек */}
      <div className="map-stats-pill">
        <Sparkles size={14} />
        <span>
          {loadingLocations
            ? 'Загрузка...'
            : `Точек на карте: ${locations.length} · Найдено: ${collection.length}`}
        </span>
      </div>

      {/* Карточка выбранной точки (Нижний Bottom Sheet) */}
      {selectedLocation && (
        <div className="location-bottom-card">
          <div className="card-drag-handle" onClick={() => setSelectedLocation(null)} />
          <div className="location-card-content">
            <div className="location-card-top">
              <div>
                <span className="location-kicker">
                  {selectedLocation.status === 'captured' ? (
                    <span className="status-badge captured">
                      <Check size={12} /> Персонаж в коллекции
                    </span>
                  ) : selectedLocation.status === 'locked' ? (
                    <span className="status-badge locked">
                      <Lock size={12} /> Заблокировано
                    </span>
                  ) : (
                    <span className="status-badge available">
                      <Sparkles size={12} /> Готов к встрече
                    </span>
                  )}
                </span>
                <h3 className="location-name">{selectedLocation.name}</h3>
                <div className="entity-sub">
                  Хранитель: <b>{selectedLocation.entityName}</b>
                </div>
              </div>

              {/* Расстояние до точки */}
              <div className="distance-badge-box">
                <MapPin size={16} />
                <span className="distance-text">
                  {distanceToSelected !== null
                    ? formatDistance(distanceToSelected)
                    : 'GPS выкл.'}
                </span>
              </div>
            </div>

            {selectedLocation.description && (
              <p className="location-desc">{selectedLocation.description}</p>
            )}

            <div className="location-actions">
              {selectedLocation.status === 'captured' ? (
                <Link to="/collection" className="button cream full-w">
                  Смотреть в коллекции
                  <ArrowRight size={17} />
                </Link>
              ) : isNearby ? (
                <Link
                  to={`/encounter/${selectedLocation.tag ?? 'forest-01'}`}
                  className="button primary full-w pulse-button"
                >
                  Встретить хранителя
                  <ArrowRight size={17} />
                </Link>
              ) : (
                <div className="distance-gated-box">
                  <div className="distance-notice">
                    {distanceToSelected !== null ? (
                      <span>
                        Вы слишком далеко. Подойдите ближе, чем на {INTERACTION_RADIUS} м
                        (сейчас {formatDistance(distanceToSelected)}).
                      </span>
                    ) : (
                      <span>Включите геолокацию или используйте демо-вход.</span>
                    )}
                  </div>
                  {/* Запасная демо-кнопка для удобства проверки на хакатоне */}
                  <Link
                    to={`/encounter/${selectedLocation.tag ?? 'forest-01'}`}
                    className="button cream full-w demo-entry-btn"
                  >
                    Открыть встречу (демо-режим)
                    <ArrowRight size={16} />
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
