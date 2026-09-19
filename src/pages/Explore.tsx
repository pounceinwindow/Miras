import { useState } from 'react'
import { ScannerSheet } from '../components/ScannerSheet'
import { Link, useNavigate } from 'react-router-dom'
import {
  ArrowUpRight,
  ArrowRight,
  ScanLine,
  Map,
  Swords,
  Lock,
} from 'lucide-react'
import { useGame } from '../store/game'
import { CharacterArt } from '../components/CharacterArt'
import type { CharacterId } from '../api/types'

export default function Explore() {
  const [scannerOpen, setScannerOpen] = useState(false)
  const navigate = useNavigate()
  const { progress, entities, run } = useGame()

  const captiveIds: CharacterId[] = ['kereml', 'shurale', 'su-anasy']
  const captiveEnemies = captiveIds.map((id) => {
    const found = entities.find((e) => e.id === id)
    return (
      found || {
        id,
        name:
          id === 'kereml'
            ? 'Керемль'
            : id === 'shurale'
              ? 'Шурале'
              : 'Су анасы',
        element:
          id === 'kereml' ? 'Камень' : id === 'shurale' ? 'Лес' : 'Вода',
        kind: 'Хранитель',
        hp: 100,
        attack: 16,
      }
    )
  })

  const handleFight = async (enemyId: CharacterId) => {
    let playerHero = progress.collection[0]?.id
    if (!playerHero) {
      const starter = enemyId === 'shurale' ? 'su-anasy' : 'shurale'
      await run({ type: 'capture', characterId: starter })
      playerHero = starter
    }
    const currentBattle = progress.battle
    if (currentBattle?.status !== 'active') {
      await run({ type: 'startBattle', characterId: playerHero, enemyId })
    }
    navigate(`/fight/${playerHero}`)
  }

  const heroDescriptions: Record<string, string> = {
    shurale: 'Герой сказок',
    syuyumbike: 'Святыня Кремля',
    'su-anasy': 'Героиня легенд',
    kereml: 'Крепость Казани',
  }

  return (
    <div className="home-page">
      {scannerOpen && <ScannerSheet onClosed={() => setScannerOpen(false)} />}

      <section className="heroes-preview-section" aria-labelledby="heroes-title">
        <div className="heroes-preview-header">
          <div>
            <h1 id="heroes-title">Мои хранители</h1>
            <p className="hero-intro">
              Герои древних сказаний рядом с тобой.
            </p>
          </div>
          <Link className="button-show-all" to="/collection">
            <span>Показать всех</span>
            <ArrowRight size={16} />
          </Link>
        </div>

        <div className="heroes-compact-grid">
          {entities.map((hero) => (
            <Link
              key={hero.id}
              to={`/entity/${hero.id}`}
              className="hero-compact-card"
            >
              <div className={`hero-compact-art art-${hero.id}`}>
                <CharacterArt id={hero.id} />
              </div>
              <div className="hero-compact-details">
                <strong>{hero.name}</strong>
                <small>
                  {heroDescriptions[hero.id] ?? hero.kind ?? 'Герой легенд'}
                </small>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <div className="home-step-bridge" aria-label="Шаг 01: Сканирование">
        <div className="step-bridge-chip">01</div>
        <div className="step-bridge-body">
          <strong className="step-bridge-title">Отсканируй место</strong>
          <span className="step-bridge-desc">
            Наведи камеру на метку или найди на карте
          </span>
        </div>
        <div className="step-bridge-icon">
          <ScanLine size={17} />
        </div>
      </div>

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

      <div className="home-step-bridge" aria-label="Шаг 02: Поединок">
        <div className="step-bridge-chip">02</div>
        <div className="step-bridge-body">
          <strong className="step-bridge-title">Пройди испытание</strong>
          <span className="step-bridge-desc">
            Сразись с заточенным духом и открой его силу
          </span>
        </div>
        <div className="step-bridge-icon">
          <Swords size={17} />
        </div>
      </div>

      <section className="captive-arena" aria-labelledby="captive-title">
        <div className="captive-header">
          <div className="captive-title-wrap">
            <span className="captive-icon">
              <Swords size={20} />
            </span>
            <div>
              <h2 id="captive-title">Враги в плену</h2>
              <small>Выбери соперника для поединка</small>
            </div>
          </div>
          <span className="captive-badge">3 ЯЧЕЙКИ</span>
        </div>

        <div className="captive-grid">
          {captiveEnemies.map((enemy, idx) => (
            <div key={enemy.id} className="captive-card">
              <div className="captive-cell-header">
                <span className="cell-num">0{idx + 1}</span>
                <span className="cell-tag">
                  <Lock size={9} /> В плену
                </span>
              </div>
              <div className="captive-dungeon-cell">
                <div className={`captive-art-wrap art-${enemy.id}`}>
                  <CharacterArt id={enemy.id} />
                </div>
                <div className="captive-iron-bars" aria-hidden="true">
                  <span className="iron-bar" />
                  <span className="iron-bar" />
                  <span className="iron-bar" />
                  <span className="iron-crossbar" />
                  <div className="iron-padlock">
                    <Lock size={11} strokeWidth={2.4} />
                  </div>
                </div>
              </div>
              <div className="captive-info">
                <strong>{enemy.name}</strong>
                <small className="captive-status-desc">Заточен в клетке</small>
              </div>
              <button
                type="button"
                className="captive-fight-btn"
                onClick={() => handleFight(enemy.id)}
              >
                <Swords size={13} /> Сразиться
              </button>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
