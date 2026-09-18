import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  Clock,
  ExternalLink,
  Sparkles,
} from 'lucide-react'
import type { Entity, Quiz } from '../api/types'
import { useGame } from '../store/game'
import { CharacterArt } from './CharacterArt'
export function EncounterFlow({
  character,
  questions = [],
  quiz = false,
}: {
  character: Entity
  questions?: Quiz['questions']
  quiz?: boolean
}) {
  const { progress, run, busy, ready } = useGame()
  const [phase, setPhase] = useState<'story' | 'quiz' | 'captured' | 'failed'>(
    quiz ? 'quiz' : 'story',
  )
  const [answers, setAnswers] = useState<number[]>([])
  const [selected, setSelected] = useState<number | null>(null)
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(timer)
  }, [])
  const owned = progress.collection.find((c) => c.id === character.id)
  const until = Date.parse(progress.cooldowns[character.id] || '')
  const remaining = Math.max(0, until - now)
  const locked = remaining > 0
  const hours = Math.floor(remaining / 3600000),
    minutes = Math.floor((remaining % 3600000) / 60000),
    seconds = Math.floor((remaining % 60000) / 1000)
  async function answer() {
    if (selected === null || !character) return
    const next = [...answers, selected]
    if (next.length === 3) {
      const result = await run({
        type: 'capture',
        characterId: character.id,
        answers: next,
      })
      if (result) setPhase(result)
    } else {
      setAnswers(next)
      setSelected(null)
    }
  }
  return (
    <>
      <Link to="/home" className="back-link">
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
          {phase === 'captured' ? (
            <div className="result-panel" aria-live="polite">
              <span className="result-icon">
                <Sparkles />
              </span>
              <span className="eyebrow">НАЧАЛО НОВОЙ ДРУЖБЫ</span>
              <h2>{character.name} теперь с тобой!</h2>
              <p>
                Все три ответа верны. Хранитель добавлен в коллекцию с первым
                уровнем.
              </p>
              <Link to="/collection" className="button">
                Открыть коллекцию
                <ArrowRight size={18} />
              </Link>
            </div>
          ) : locked || phase === 'failed' ? (
            <div className="result-panel" aria-live="polite">
              <span className="result-icon">
                <Clock />
              </span>
              <h2>У каждой истории своё время</h2>
              <p>
                Не все ответы были верными. Перечитай историю и возвращайся
                после окончания ожидания.
              </p>
              <strong className="countdown">
                {locked
                  ? `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
                  : 'Попытка снова доступна'}
              </strong>
              {!locked && (
                <button
                  className="button"
                  onClick={() => {
                    setPhase(quiz ? 'quiz' : 'story')
                    setAnswers([])
                    setSelected(null)
                  }}
                >
                  Попробовать снова
                </button>
              )}
              <details>
                <summary>Перечитать историю</summary>
                {character.story.map((p) => (
                  <p key={p}>{p}</p>
                ))}
              </details>
              <Link to="/home" className="text-link">
                Познакомиться с другими хранителями <ArrowRight size={16} />
              </Link>
            </div>
          ) : phase === 'story' || owned ? (
            <>
              <span className="eyebrow">
                <BookOpen size={15} /> ИСТОРИЯ ХРАНИТЕЛЯ
              </span>
              <h2>Давай познакомимся.</h2>
              {character.story.map((p) => (
                <p key={p}>{p}</p>
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
                {owned ? (
                  <>
                    <span className="success-line">
                      <Check size={18} /> Уже в коллекции · уровень{' '}
                      {owned.level}
                    </span>
                    <Link className="button" to={`/entity/${character.id}`}>
                      О хранителе
                      <ArrowRight size={18} />
                    </Link>
                  </>
                ) : (
                  <>
                    <p className="muted">
                      Три вопроса по истории. Все ответы верны — хранитель твой.
                      Ошибка — новая попытка через 24 часа.
                    </p>
                    <Link className="button" to={`/quiz/${character.id}`}>
                      Я готов к знакомству
                      <ArrowRight size={18} />
                    </Link>
                  </>
                )}
              </div>
            </>
          ) : (
            <>
              <div className="section-title">
                <span className="eyebrow">ПРОВЕРЬ СЕБЯ</span>
                <span>Вопрос {answers.length + 1} из 3</span>
              </div>
              <div className="quiz-progress">
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    className={i <= answers.length ? 'filled' : ''}
                  />
                ))}
              </div>
              <h2>{questions[answers.length].text}</h2>
              <fieldset className="answer-options">
                <legend className="sr-only">Выбери один ответ</legend>
                {questions[answers.length].options.map((option, i) => (
                  <label
                    key={option}
                    className={selected === i ? 'selected' : ''}
                  >
                    <input
                      type="radio"
                      name="answer"
                      value={i}
                      checked={selected === i}
                      onChange={() => setSelected(i)}
                      disabled={busy}
                    />
                    <span>{option}</span>
                  </label>
                ))}
              </fieldset>
              <button
                className="button"
                disabled={selected === null || busy || !ready}
                onClick={() => void answer()}
              >
                {busy
                  ? 'Проверяем…'
                  : answers.length === 2
                    ? 'Завершить знакомство'
                    : 'Следующий вопрос'}
                <ArrowRight size={18} />
              </button>
              <p className="muted">Результат появится после трёх ответов.</p>
            </>
          )}
        </section>
      </div>
    </>
  )
}
