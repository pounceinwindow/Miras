import { useState } from 'react'
import { ScannerSheet } from '../components/ScannerSheet'
import { Link, useNavigate } from 'react-router-dom'
import {
  ArrowUpRight,
  ScanLine,
  Map,
  Swords,
  Lock,
  X,
} from 'lucide-react'
import { useGame } from '../store/game'
import { CharacterArt } from '../components/CharacterArt'
import type { CharacterId } from '../api/types'

export default function Explore() {
  const [scannerOpen, setScannerOpen] = useState(false)
  const [selectedEnemy, setSelectedEnemy] = useState<CharacterId | null>(null)
  const navigate = useNavigate()
  const { progress, entities, run } = useGame()

  const ownedIds = new Set(progress.collection.map((item) => item.id))
  const captiveIds: CharacterId[] = (progress.captives ?? []).filter(
    (id) => !ownedIds.has(id),
  )
  const CELL_COUNT = 3
  const slots: (CharacterId | null)[] = Array.from(
    { length: Math.max(CELL_COUNT, captiveIds.length) },
    (_, i) => captiveIds[i] ?? null,
  )

  const handleFightClick = (enemyId: CharacterId) => {
    const ownedHeroes = progress.collection
    if (ownedHeroes.length > 1) {
      setSelectedEnemy(enemyId)
    } else {
      void startDuel(ownedHeroes[0]?.id, enemyId)
    }
  }

  const startDuel = async (
    playerHeroId?: CharacterId,
    enemyId?: CharacterId,
  ) => {
    if (!enemyId) return
    let fighterId = playerHeroId
    if (!fighterId) {
      const starter: CharacterId = 'su-anasy'
      await run({ type: 'capture', characterId: starter })
      fighterId = starter
    }
    const currentBattle = progress.battle
    if (currentBattle?.status !== 'active') {
      await run({ type: 'startBattle', characterId: fighterId, enemyId })
    }
    navigate(`/fight/${fighterId}?enemy=${enemyId}`)
  }

  const getEnemyEntity = (id: CharacterId) => {
    return (
      entities.find((e) => e.id === id) || {
        id,
        name:
          id === 'kereml'
            ? 'Керемль'
            : id === 'shurale'
              ? 'Шурале'
              : id === 'syuyumbike'
                ? 'Сююмбике'
                : 'Су анасы',
        element: id === 'kereml' ? 'Камень' : id === 'shurale' ? 'Лес' : 'Вода',
        kind: 'Хранитель',
        hp: 100,
        attack: 16,
      }
    )
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

      <section
        className="heroes-preview-section"
        aria-labelledby="heroes-title"
      >
        <div className="heroes-preview-header">
          <h1 id="heroes-title">Мои хранители</h1>
        </div>

        <div className="heroes-compact-grid">
          {entities
            .filter((hero) => ownedIds.has(hero.id))
            .map((hero) => (
              <Link
                key={hero.id}
                to={`/entity/${hero.id}`}
                className={`hero-compact-card card-${hero.id}`}
              >
                <div className={`hero-compact-art art-${hero.id}`}>
                  <img
                    className="hero-compact-pixel"
                    src={`/pixel/${hero.id}.png`}
                    alt=""
                    aria-hidden="true"
                  />
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
              <h2 id="captive-title">Хранители в плену</h2>
              <small>Выбери соперника для поединка</small>
            </div>
          </div>
        </div>

        <div className="captive-grid">
          {slots.map((enemyId, idx) => {
            if (enemyId) {
              const enemy = getEnemyEntity(enemyId)
              return (
                <div key={enemy.id} className="captive-card">
                  <div className="captive-cell-header">
                    <span className="cell-tag">
                      <Lock size={9} /> <span>В плену</span>
                    </span>
                  </div>
                  <div className="captive-dungeon-cell">
                    <div className={`captive-art-wrap art-${enemy.id}`}>
                      <img
                        className="captive-pixel-art"
                        src={`/pixel/${enemy.id}.png`}
                        alt=""
                        aria-hidden="true"
                      />
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
                    <small className="captive-status-desc">
                      Заточен в клетке
                    </small>
                  </div>
                  <button
                    type="button"
                    className="captive-fight-btn"
                    onClick={() => handleFightClick(enemy.id)}
                  >
                    <Swords size={13} /> Сразиться
                  </button>
                </div>
              )
            }

            return (
              <div key={`empty-${idx}`} className="captive-card is-empty">
                <div className="captive-cell-header">
                  <span className="cell-tag empty-tag">
                    <span>Свободно</span>
                  </span>
                </div>
                <div className="captive-dungeon-cell is-empty">
                  <div className="captive-empty-placeholder">
                    <Lock size={18} strokeWidth={1.4} />
                  </div>
                  <div className="captive-iron-bars" aria-hidden="true">
                    <span className="iron-bar" />
                    <span className="iron-bar" />
                    <span className="iron-bar" />
                    <span className="iron-crossbar" />
                  </div>
                </div>
                <div className="captive-info">
                  <strong>Пустая клетка</strong>
                  <small className="captive-status-desc">
                    Найди духа по метке
                  </small>
                </div>
                <button
                  type="button"
                  className="captive-fight-btn captive-empty-btn"
                  onClick={() => setScannerOpen(true)}
                >
                  Пленить духа
                </button>
              </div>
            )
          })}
        </div>
      </section>

      {selectedEnemy && (
        <div
          className="modal-backdrop"
          onClick={() => setSelectedEnemy(null)}
          role="presentation"
        >
          <div
            className="fighter-select-modal"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-label="Выбор бойца"
          >
            <div className="fighter-modal-header">
              <div>
                <h2>Выбери своего бойца</h2>
                <p>Кто сразится против {getEnemyEntity(selectedEnemy).name}?</p>
              </div>
              <button
                type="button"
                className="fighter-modal-close"
                onClick={() => setSelectedEnemy(null)}
                aria-label="Закрыть"
              >
                <X size={18} />
              </button>
            </div>
            <div className="fighter-select-grid">
              {progress.collection.map((hero) => {
                const entity = entities.find((e) => e.id === hero.id)
                return (
                  <button
                    key={hero.id}
                    type="button"
                    className="fighter-select-card"
                    onClick={() => {
                      const enemy = selectedEnemy
                      setSelectedEnemy(null)
                      void startDuel(hero.id, enemy)
                    }}
                  >
                    <div className={`fighter-card-art art-${hero.id}`}>
                      <CharacterArt id={hero.id} />
                    </div>
                    <div className="fighter-card-info">
                      <strong>{entity?.name ?? hero.id}</strong>
                      <small>{entity?.element ?? 'Магия'}</small>
                    </div>
                    <span className="fighter-pick-action">
                      <Swords size={13} /> Выбрать
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
