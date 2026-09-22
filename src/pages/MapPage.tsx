import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import {
  ArrowLeft,
  ArrowUpRight,
  Check,
  LocateFixed,
  MapPin,
  Minus,
  Plus,
  X,
} from 'lucide-react'
import { getLocations, type LocationPoint } from '../api/locations'
import { calculateDistance, formatDistance, type GeoPoint } from '../utils/geo'
import { useGame } from '../store/game'
import { trackEvent } from '../lib/analytics'

// Leaflet map and location catalogue adapted from Miras-feature-map.
export default function MapPage() {
  const container = useRef<HTMLDivElement>(null)
  const map = useRef<L.Map | null>(null)
  const player = useRef<L.Marker | null>(null)
  const mounted = useRef(false)
  const collection = useGame((s) => s.progress.collection)
  const entities = useGame((s) => s.entities)
  const [locations, setLocations] = useState<LocationPoint[]>([])
  const [selected, setSelected] = useState<LocationPoint | null>(null)
  const [position, setPosition] = useState<GeoPoint | null>(null)
  const [geoBusy, setGeoBusy] = useState(false)
  const [geoError, setGeoError] = useState('')
  const [tilesUnavailable, setTilesUnavailable] = useState(false)

  useEffect(() => {
    mounted.current = true
    void getLocations().then((data) => {
      if (mounted.current) setLocations(data)
    })
    return () => {
      mounted.current = false
    }
  }, [])

  useEffect(() => {
    if (!container.current) return
    const instance = L.map(container.current, {
      center: [55.792, 49.122],
      zoom: 13,
      zoomControl: false,
    })
    map.current = instance
    const tiles = L.tileLayer(
      'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
      {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 19,
      },
    ).addTo(instance)
    tiles.on('tileerror', () => setTilesUnavailable(true))
    const resize = new ResizeObserver(() => instance.invalidateSize())
    resize.observe(container.current)
    return () => {
      resize.disconnect()
      instance.remove()
      map.current = null
      player.current = null
    }
  }, [])

  useEffect(() => {
    const instance = map.current
    if (!instance) return
    const group = L.layerGroup().addTo(instance)
    locations.forEach((location) => {
      const entity = entities.find((item) => item.tag === location.tag)
      const captured = collection.some((item) => item.id === entity?.id)
      const pin = document.createElement('div')
      pin.className = `map-location-pin ${captured ? 'captured' : ''} ${selected?.id === location.id ? 'selected' : ''}`
      pin.textContent = captured ? '✓' : '✦'
      const marker = L.marker([location.latitude, location.longitude], {
        icon: L.divIcon({
          className: 'location-marker',
          html: pin,
          iconSize: [40, 46],
          iconAnchor: [20, 44],
        }),
        title: location.entityName,
        alt: location.entityName,
      }).addTo(group)
      marker.on('click', () => setSelected(location))
    })
    return () => {
      group.remove()
    }
  }, [locations, collection, entities, selected])

  useEffect(() => {
    if (!position || !map.current) return
    player.current?.remove()
    player.current = L.marker([position.latitude, position.longitude], {
      icon: L.divIcon({
        className: 'player-location',
        html: '<span></span>',
        iconSize: [22, 22],
      }),
      title: 'Вы здесь',
    }).addTo(map.current)
    map.current.setView([position.latitude, position.longitude], 15)
  }, [position])

  function locate() {
    if (!navigator.geolocation) {
      setGeoError(
        'Этот браузер не поддерживает геолокацию. Выбери место из списка.',
      )
      return
    }
    setGeoBusy(true)
    setGeoError('')
    navigator.geolocation.getCurrentPosition(
      (value) => {
        if (mounted.current) {
          setPosition(value.coords)
          setGeoBusy(false)
        }
      },
      (error) => {
        if (mounted.current) {
          setGeoError(
            error.code === 1
              ? 'Разреши геолокацию в настройках браузера или выбери место из списка.'
              : 'Не удалось найти тебя. Попробуй ещё раз или выбери место из списка.',
          )
          setGeoBusy(false)
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 },
    )
  }
  const entity = entities.find((item) => item.tag === selected?.tag)
  const captured = collection.some((item) => item.id === entity?.id)
  return (
    <div className="map-page">
      <Link className="back-link" to="/home">
        <ArrowLeft size={17} /> На главную
      </Link>
      <div className="mobile-page-heading">
        <span className="eyebrow">ЛЕГЕНДЫ НА КАРТЕ</span>
        <h1>Куда отправимся?</h1>
        <p>Выбери место. Познакомься с его хранителем.</p>
      </div>
      <div className="live-map-shell">
        <div
          ref={container}
          className="live-map"
          aria-label="Карта Казани с местами встреч"
        />
        <span className="map-city-badge">
          <MapPin size={13} /> Казань · {locations.length} места
        </span>
        <div className="map-controls">
          <button
            onClick={() => map.current?.zoomIn()}
            aria-label="Приблизить карту"
          >
            <Plus size={20} />
          </button>
          <button
            onClick={() => map.current?.zoomOut()}
            aria-label="Отдалить карту"
          >
            <Minus size={20} />
          </button>
          <button
            onClick={locate}
            disabled={geoBusy}
            aria-label="Моё местоположение"
          >
            <LocateFixed size={20} />
          </button>
        </div>
      </div>
      {geoBusy && (
        <p className="map-message" role="status">
          Определяем твоё местоположение…
        </p>
      )}
      {geoError && (
        <p className="map-message" role="alert">
          {geoError}
        </p>
      )}
      {tilesUnavailable && (
        <p className="map-message" role="status">
          Подложка карты недоступна. Все места можно открыть из списка ниже.
        </p>
      )}
      {selected && (
        <section className="location-detail" aria-label="Выбранное место">
          <button
            className="close-location"
            onClick={() => setSelected(null)}
            aria-label="Закрыть место"
          >
            <X size={19} />
          </button>
          <span className="eyebrow">
            {captured ? 'УЖЕ В ТВОЕЙ КОМАНДЕ' : 'НОВАЯ ИСТОРИЯ'}
          </span>
          <h2>{selected.entityName}</h2>
          <p>{selected.description}</p>
          {position && (
            <span className="location-distance">
              <MapPin size={13} />
              {formatDistance(
                calculateDistance(
                  position.latitude,
                  position.longitude,
                  selected.latitude,
                  selected.longitude,
                ),
              )}{' '}
              от тебя
            </span>
          )}
          <Link
            className="button"
            to={
              captured ? `/entity/${entity?.id}` : `/encounter/${selected.tag}`
            }
          >
            {captured ? 'Открыть бойца' : 'Встретить хранителя'}
            <ArrowUpRight size={17} />
          </Link>
        </section>
      )}
      <div className="places-heading">
        <h2>Места с историей</h2>
        <span>{locations.length} / 4</span>
      </div>
      <div className="places-list">
        {locations.map((location, index) => {
          const owned = collection.some(
            (item) =>
              item.id ===
              entities.find((item) => item.tag === location.tag)?.id,
          )
          return (
            <button
              key={location.id}
              className={selected?.id === location.id ? 'selected' : ''}
              onClick={() => {
                setSelected(location)
                trackEvent('location_selected', {
                  location_id: location.id,
                  character_id:
                    entities.find((item) => item.tag === location.tag)?.id ??
                    'unknown',
                })
                map.current?.setView(
                  [location.latitude, location.longitude],
                  15,
                )
              }}
            >
              <span className="place-number">
                {owned ? <Check size={18} /> : `0${index + 1}`}
              </span>
              <span>
                <strong>{location.entityName}</strong>
                <small>{location.name}</small>
              </span>
              <ArrowUpRight size={18} />
            </button>
          )
        })}
      </div>
      <p className="map-footnote">
        Демо-маршрут: встречи доступны без GPS. Точки на карте не подтверждают
        наличие физических AR-меток.
      </p>
    </div>
  )
}
