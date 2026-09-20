/* eslint-disable react-hooks/purity */

import { useEffect, useRef, useState } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import {
  ArrowRight,
  ExternalLink,
  Heart,
  Swords,
  Shield,
  Sparkles,
  Check,
  MessageCircle,
} from 'lucide-react'
import { useGame } from '../store/game'
import { QueryState } from '../components/QueryState'
import { CharacterSpeech } from '../components/CharacterSpeech'
import type { Entity, CharacterId } from '../api/types'

export default function EntityPage({ character, isEncounter }: { character?: Entity; isEncounter?: boolean }) {
  const { id } = useParams()
  const { entities, progress, run, busy, ready } = useGame()
  const navigate = useNavigate()
  const entity = character || entities.find((candidate) => candidate.id === id)
  const [collapsed, setCollapsed] = useState(false)
  const [cardSpeechState, setCardSpeechState] = useState<'open' | 'closing' | 'closed'>('open')
  const dragStart = useRef<number | null>(null)

  // Quiz state
  const [quizSuccess, setQuizSuccess] = useState(false)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(() => Math.floor(Math.random() * (entity?.quiz?.length || 1)))
  const [wrongAnswer, setWrongAnswer] = useState(false)
  const entityId = entity?.id
  const heroSpeechLine = isEncounter
    ? entity?.voice?.challenge
    : entity?.voice?.card
  const hasHeroSpeech = Boolean(heroSpeechLine)

  useEffect(() => {
    if (!hasHeroSpeech || isEncounter || cardSpeechState !== 'open') return
    const timer = window.setTimeout(() => {
      setCardSpeechState(
        window.matchMedia('(prefers-reduced-motion: reduce)').matches
          ? 'closed'
          : 'closing',
      )
    }, 5800)
    return () => window.clearTimeout(timer)
  }, [cardSpeechState, entityId, hasHeroSpeech, isEncounter])

  if (!entity) return <QueryState error="Хранитель не найден" />

  const question = entity.quiz?.[currentQuestionIndex]

  function handleAnswer(index: number) {
    if (index === question.correctIndex) {
      setQuizSuccess(true)
      setWrongAnswer(false)
    } else {
      setWrongAnswer(true)
      const remaining = entity!.quiz.map((_, i) => i).filter((i) => i !== currentQuestionIndex)
      setCurrentQuestionIndex(remaining[Math.floor(Math.random() * remaining.length)])
    }
  }

  async function beginEncounter() {
    let playerId = progress.collection.find((item) => item.id !== entity!.id)?.id
    if (!playerId) {
      const starter: CharacterId = entity!.id === 'su-anasy' ? 'shurale' : 'su-anasy'
      const outcome = await run({ type: 'capture', characterId: starter })
      if (outcome !== 'captured') return
      playerId = starter
    }
    if (!owned) {
      const outcome = await run({ type: 'imprison', characterId: entity!.id })
      if (outcome !== 'imprisoned') return
    }
    if (useGame.getState().progress.battle?.status !== 'active') {
      await run({ type: 'startBattle', characterId: playerId, enemyId: entity!.id })
    }
    if (useGame.getState().progress.battle?.status !== 'active') return
    navigate(`/fight/${playerId}?enemy=${entity!.id}${quizSuccess ? '&bonus=true' : ''}`)
  }

  const owned = progress.collection.some((char) => char.id === entity.id)
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
            alt={hasHeroSpeech ? `Реплика: ${displayName}` : ''}
            aria-hidden={hasHeroSpeech ? undefined : true}
            role={hasHeroSpeech ? 'button' : undefined}
            tabIndex={hasHeroSpeech ? 0 : undefined}
            aria-expanded={hasHeroSpeech ? cardSpeechState === 'open' : undefined}
            onClick={
              hasHeroSpeech
                ? () => setCardSpeechState((state) => state === 'open' ? 'closing' : 'open')
                : undefined
            }
            onKeyDown={(event) => {
              if (!hasHeroSpeech) return
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault()
                setCardSpeechState((state) => state === 'open' ? 'closing' : 'open')
              }
            }}
          />
          {heroSpeechLine && (
            <>
              {cardSpeechState !== 'closed' && (
                <CharacterSpeech
                  line={heroSpeechLine}
                  placement="hero"
                  visible={cardSpeechState === 'open'}
                  onExitComplete={() => setCardSpeechState('closed')}
                />
              )}
              <button
                type="button"
                className={`character-speech-toggle ${cardSpeechState === 'closed' ? 'is-visible' : ''}`}
                aria-label="Показать реплику"
                onClick={() => setCardSpeechState('open')}
              >
                <MessageCircle size={15} />
              </button>
            </>
          )}
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
            
            {isEncounter ? (
              <div className="story-action" style={{ marginTop: 24 }}>
                {owned && (
                  <span className="success-line" style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
                    <Check size={18} /> Уже в коллекции
                  </span>
                )}

                <div className="quiz-section" style={{ padding: 16, background: '#132b31', borderRadius: 8, border: '1px solid var(--border)' }}>
                  {!quizSuccess ? (
                    <>
                      <p style={{ margin: '0 0 12px 0', fontSize: 13, color: '#a2b8b2' }}>
                        Прочитай историю и ответь на вопрос, чтобы ослабить хранителя на 10% перед боем:
                      </p>
                      <strong style={{ display: 'block', marginBottom: 12, fontSize: 15, color: '#eef5f3' }}>{question?.question}</strong>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {question?.options.map((opt, i) => (
                          <button 
                            key={opt}
                            onClick={() => handleAnswer(i)}
                            className="button secondary"
                            style={{ justifyContent: 'flex-start', textAlign: 'left', height: 'auto', padding: '10px 14px' }}
                          >
                            {opt}
                          </button>
                        ))}
                      </div>
                      {wrongAnswer && <p style={{ color: '#d96c6c', margin: '12px 0 0 0', fontSize: 13 }}>Неверно. Попробуй ответить на другой вопрос.</p>}
                    </>
                  ) : (
                    <div style={{ color: '#a7beb9', display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Check color="#83c27a" size={20} />
                      <span><strong>Верно!</strong> Хранитель ослаблен на 10%.</span>
                    </div>
                  )}
                </div>

                <button
                  className="button"
                  style={{ marginTop: 20 }}
                  disabled={busy || !ready || !quizSuccess}
                  onClick={() => void beginEncounter()}
                >
                  <Swords size={18} />
                  {busy ? 'Готовим бой…' : 'Начать испытание'}
                  <ArrowRight size={18} />
                </button>
              </div>
            ) : (
              !owned && (
                <Link className="button" style={{ marginTop: 20 }} to={`/encounter/${entity.tag}`}>
                  Встретить хранителя <ArrowRight size={18} />
                </Link>
              )
            )}
          </section>
        </div>
      </article>
    </>
  )
}
