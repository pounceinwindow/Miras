import { Link, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  ExternalLink,
  Swords,
} from 'lucide-react'
import type { CharacterId, Entity } from '../api/types'
import { useGame } from '../store/game'
import { CharacterArt } from './CharacterArt'

export function EncounterFlow({ character }: { character: Entity }) {
  const navigate = useNavigate()
  const { progress, run, busy, ready } = useGame()
  const owned = progress.collection.find((item) => item.id === character.id)

  async function beginEncounter() {
    let playerId = progress.collection.find(
      (item) => item.id !== character.id,
    )?.id
    if (!playerId) {
      const starter: CharacterId =
        character.id === 'su-anasy' ? 'shurale' : 'su-anasy'
      const outcome = await run({ type: 'capture', characterId: starter })
      if (outcome !== 'captured') return
      playerId = starter
    }
    if (!owned) {
      const outcome = await run({
        type: 'capture',
        characterId: character.id,
      })
      if (outcome !== 'captured') return
    }
    if (useGame.getState().progress.battle?.status !== 'active') {
      await run({
        type: 'startBattle',
        characterId: playerId,
        enemyId: character.id,
      })
    }
    if (useGame.getState().progress.battle?.status !== 'active') return
    navigate(`/fight/${playerId}?enemy=${character.id}`)
  }

  return (
    <>
      <Link to="/map" className="back-link">
        <ArrowLeft size={17} /> К карте легенд
      </Link>
      <div className="encounter-grid">
        <div className={`portrait-panel art-${character.id}`}>
          <span className="pill dark">{character.kind}</span>
          <CharacterArt id={character.id} />
          <span className="eyebrow">{character.tatar}</span>
          <h1>{character.name}</h1>
          <p>{character.title}</p>
        </div>
        <section className="story-panel">
          <span className="eyebrow">
            <BookOpen size={15} /> ИСТОРИЯ ХРАНИТЕЛЯ
          </span>
          <h2>Давай познакомимся.</h2>
          {character.story.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
          {character.source.url ? (
            <a
              className="source-link"
              href={character.source.url}
              target="_blank"
              rel="noreferrer"
            >
              {character.source.label}
              <ExternalLink size={14} />
            </a>
          ) : (
            <span className="source-link">{character.source.label}</span>
          )}
          <div className="story-action">
            {owned && (
              <span className="success-line">
                <Check size={18} /> Уже в коллекции
              </span>
            )}
            <p className="muted">
              Метка подтверждена. Викторины нет — переходи сразу к испытанию.
            </p>
            <button
              className="button"
              disabled={busy || !ready}
              onClick={() => void beginEncounter()}
            >
              <Swords size={18} />
              {busy ? 'Готовим бой…' : 'Начать испытание'}
              <ArrowRight size={18} />
            </button>
          </div>
        </section>
      </div>
    </>
  )
}
