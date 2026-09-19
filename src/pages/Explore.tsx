import { useState } from 'react'
import { ScannerSheet } from '../components/ScannerSheet'
import { Link } from 'react-router-dom'
import {
  ArrowUpRight,
  ArrowRight,
  ScanLine,
  Map,
  Swords,
  Sparkles,
  MapPin,
} from 'lucide-react'
import { useGame } from '../store/game'

export default function Explore() {
  const [scannerOpen, setScannerOpen] = useState(false)
  const count = useGame((s) => s.progress.collection.length)
  return (
    <div className="home-page">
      {scannerOpen && <ScannerSheet onClosed={() => setScannerOpen(false)} />}
      <section className="kazan-hero" aria-labelledby="home-title">
        <div className="hero-location">
          <MapPin size={12} /> КАЗАНЬ, ТАТАРСТАН<span>ГЛАВА 01</span>
        </div>
        <h1 id="home-title">
          Город знакомый.
          <br />
          <span>Мир — волшебный.</span>
        </h1>
        <p className="hero-intro">
          Открой легенды Казани.
          <br />
          Собери свою команду хранителей.
        </p>
        <div className="city-art">
          <img
            src="/kazan.svg"
            alt="Иллюстрация Казани: мечеть Кул-Шариф, башня Сююмбике и стены Кремля"
            width="420"
            height="260"
          />
          <span className="art-note note-left">
            Истории
            <br />
            оживают здесь
            <svg viewBox="0 0 45 28" aria-hidden="true">
              <path d="M3 3Q8 25 39 19m-7-6 8 6-8 6" />
            </svg>
          </span>
          <span className="art-note note-right">
            <Sparkles size={18} />
            Твоя легенда
            <br />
            начинается
          </span>
          <span className="city-label">КАЗАНЬ — ЭТО ТОЛЬКО НАЧАЛО</span>
        </div>
      </section>
      <section className="home-actions" aria-label="Начать приключение">
        <button
          className="action-tile scan-tile"
          type="button"
          onClick={() => setScannerOpen(true)}
          aria-haspopup="dialog"
          aria-expanded={scannerOpen}
        >
          <span className="tile-top">
            <ScanLine size={32} strokeWidth={1.5} />
            <ArrowUpRight size={21} />
          </span>
          <span>
            <strong>
              Начать
              <br />
              сканировать
            </strong>
            <small>Найди скрытую легенду</small>
          </span>
        </button>
        <Link className="action-tile map-tile" to="/map">
          <span className="tile-top">
            <Map size={32} strokeWidth={1.5} />
            <ArrowUpRight size={21} />
          </span>
          <span>
            <strong>
              Открыть
              <br />
              карту
            </strong>
            <small>Места с характером</small>
          </span>
        </Link>
      </section>
      <Link className="fighters-link" to="/collection">
        <span className="fighters-icon">
          <Swords size={23} />
        </span>
        <span>
          <strong>Мои бойцы</strong>
          <small>
            {count
              ? `${count} из 4 хранителей уже с тобой`
              : 'Собери команду для больших историй'}
          </small>
        </span>
        <ArrowRight size={20} />
      </Link>
      <section className="home-guide" aria-labelledby="guide-title">
        <div className="guide-heading">
          <h2 id="guide-title">Как это работает</h2>
          <span>3 ПРОСТЫХ ШАГА</span>
        </div>
        <ol>
          <li>
            <span className="guide-number">01</span>
            <div>
              <h3>Отсканируй место</h3>
              <p>
                Найди метку и наведи камеру —<br />
                за ней скрывается целая история.
              </p>
            </div>
            <ScanLine size={22} />
          </li>
          <li>
            <span className="guide-number">02</span>
            <div>
              <h3>Пройди испытание</h3>
              <p>
                После сканирования сразу начнётся
                <br />испытание найденного хранителя.
              </p>
            </div>
            <Swords size={22} />
          </li>
          <li>
            <span className="guide-number">03</span>
            <div>
              <h3>Познакомься с героем</h3>
              <p>
                После боя откроется его история,
                <br />способности и место в коллекции.
              </p>
            </div>
            <Sparkles size={22} />
          </li>
        </ol>
      </section>
    </div>
  )
}
