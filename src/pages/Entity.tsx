import { Link, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  ArrowRight,
  Heart,
  Swords,
  Shield,
  Sparkles,
} from 'lucide-react'
import { useGame } from '../store/game'
import { CharacterArt } from '../components/CharacterArt'
import { QueryState } from '../components/QueryState'
export default function EntityPage() {
  const { id } = useParams()
  const { entities, progress } = useGame()
  const entity = entities.find((entity) => entity.id === id)
  if (!entity) return <QueryState error="Хранитель не найден" />
  const owned = progress.collection.some((c) => c.id === entity.id)
  return (
    <>
      <Link to="/collection" className="back-link">
        <ArrowLeft size={17} /> К коллекции
      </Link>
      <div className="encounter-grid">
        <div className={`portrait-panel art-${entity.id}`}>
          <span className="pill dark">
            {owned ? 'В коллекции' : 'Ещё не найден'}
          </span>
          <CharacterArt id={entity.id} />
          <span className="eyebrow">{entity.tatar}</span>
          <h1>{entity.name}</h1>
          <p>{entity.title}</p>
        </div>
        <section className="story-panel">
          <span className="eyebrow">
            {entity.element} · {entity.kind}
          </span>
          <h2>Сила твоего хранителя</h2>
          <p>{entity.description}</p>
          <dl className="entity-stats grid grid-cols-3 gap-3">
            <div>
              <dt>
                <Heart size={18} /> HP
              </dt>
              <dd>{entity.hp}</dd>
            </div>
            <div>
              <dt>
                <Swords size={18} /> Атака
              </dt>
              <dd>{entity.attack}</dd>
            </div>
            <div>
              <dt>
                <Shield size={18} /> Защита
              </dt>
              <dd>{entity.defense}%</dd>
            </div>
          </dl>
          <p className="muted">
            Защита снижает входящий урон, когда выбран защитный ход.
          </p>
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
          <details className="entity-story">
            <summary>История хранителя</summary>
            {entity.story.map((p) => (
              <p key={p}>{p}</p>
            ))}
          </details>
        </section>
      </div>
    </>
  )
}
