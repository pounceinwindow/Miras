import { useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  ArrowRight,
  ExternalLink,
  Heart,
  Swords,
  Shield,
  Sparkles,
} from 'lucide-react'
import { useGame } from '../store/game'
import { QueryState } from '../components/QueryState'

export default function EntityPage() {
  const { id } = useParams()
  const { entities, progress } = useGame()
  const entity = entities.find((candidate) => candidate.id === id)
  const [collapsed, setCollapsed] = useState(false)
  const dragStart = useRef<number | null>(null)

  if (!entity) return <QueryState error="Хранитель не найден" />

  const owned = progress.collection.some((character) => character.id === entity.id)
  const officialImage = `/official/${entity.id}.png`
  const pixelImage = `/pixel/${entity.id}.png`
  const displayName =
    entity.id === 'syuyumbike'
      ? 'Сююмбике'
      : entity.id === 'kereml'
        ? 'Казанский кремль'
        : entity.name

  function finishDrag(clientY: number) {
    if (dragStart.current === null) return
    const distance = clientY - dragStart.current
    dragStart.current = null
    if (distance < -24) setCollapsed(true)
    else if (distance > 24) setCollapsed(false)
    else setCollapsed((value) => !value)
  }

  return (
    <>
      <article
        className={`entity-lore-card art-${entity.id} ${collapsed ? 'is-collapsed' : ''}`}
      >
        <div className="entity-lore-visual">
          <img
            className="entity-official-art"
            src={officialImage}
            alt={`Изображение: ${displayName}`}
          />
          <img
            className="entity-pixel-art"
            src={pixelImage}
            alt=""
            aria-hidden="true"
          />
        </div>

        <div className="entity-drag-row">
          <button
            type="button"
            className="entity-drag-handle"
            aria-label={collapsed ? 'Показать изображение' : 'Скрыть изображение'}
            aria-expanded={!collapsed}
            onPointerDown={(event) => {
              dragStart.current = event.clientY
              event.currentTarget.setPointerCapture(event.pointerId)
            }}
            onPointerUp={(event) => finishDrag(event.clientY)}
            onPointerCancel={() => {
              dragStart.current = null
            }}
            onKeyDown={(event) => {
              if (event.key === 'ArrowUp') setCollapsed(true)
              if (event.key === 'ArrowDown') setCollapsed(false)
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault()
                setCollapsed((value) => !value)
              }
            }}
          >
            <span />
          </button>
        </div>

        <div className="entity-lore-content">
          <span className="eyebrow">
            {entity.element} · {entity.kind}
          </span>
          <h1>{displayName}</h1>
          <p className="entity-original-name">{entity.tatar}</p>

          <div className="entity-story-copy">
            {entity.story.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>

          <a
            className="source-link entity-source-link"
            href={entity.source.url}
            target="_blank"
            rel="noreferrer"
          >
            {entity.source.label}
            <ExternalLink size={14} />
          </a>

          <section className="entity-game-panel" aria-label="Игровые характеристики">
            <h2>Сила хранителя</h2>
            <dl className="entity-stats grid grid-cols-3 gap-3">
              <div>
                <dt><Heart size={18} /> HP</dt>
                <dd>{entity.hp}</dd>
              </div>
              <div>
                <dt><Swords size={18} /> Атака</dt>
                <dd>{entity.attack}</dd>
              </div>
              <div>
                <dt><Shield size={18} /> Защита</dt>
                <dd>{entity.defense}%</dd>
              </div>
            </dl>
            <div className="ability-panel">
              <Sparkles size={22} />
              <div>
                <h3>{entity.ability.name}</h3>
                <p>{entity.ability.description}</p>
              </div>
            </div>
            {!owned && (
              <Link className="button" to={`/encounter/${entity.tag}`}>
                Встретить хранителя <ArrowRight size={18} />
              </Link>
            )}
          </section>
        </div>
      </article>
    </>
  )
}
