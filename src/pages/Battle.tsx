import { lazy, Suspense, useState, useEffect, useRef } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Swords, Shield, Zap, ArrowRight, Trophy } from 'lucide-react'
import { enemyIntent } from '../api/battles'
import type { Fighter } from '../api/types'
import { useGame } from '../store/game'
import { getBattleFeedback, type BattleFeedback } from '../game/battle/feedback'
const BattleCanvas = lazy(() => import('../components/BattleCanvas'))
const actionLabels = { attack: 'Атака', guard: 'Защита', skill: 'Особый приём' }
function FighterHud({ fighter }: { fighter: Fighter }) {
  const name = useGame((s) => s.entities.find((c) => c.id === fighter.id)?.name)
  return (
    <div className="fighter-hud">
      <div>
        <b>{name}</b>
        <span>Ур. {fighter.level}</span>
      </div>
      <progress
        value={fighter.hp}
        max={fighter.maxHp}
        aria-label={`Здоровье ${name}`}
      />
      <small>
        {fighter.hp} / {fighter.maxHp} здоровья
      </small>
    </div>
  )
}
export default function Battle() {
  const { progress, entities: characters, run, busy, ready } = useGame()
  const [animating, setAnimating] = useState(false)
  const [feedback, setFeedback] = useState<BattleFeedback | null>(null)
  const actionLock = useRef(false)
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  useEffect(() => () => clearTimeout(timer.current), [])
  const { character } = useParams()
  const scannedCharacter = progress.collection.find(
    (item) => item.id === character,
  )
  const battle = progress.battle
  const active = battle?.status === 'active'
  return (
    <>
      <div className="page-heading">
        <span className="eyebrow">МЕТКА НАЙДЕНА · ИСПЫТАНИЕ НАЧАЛОСЬ</span>
        <h1>
          Встреча с легендой<span>.</span>
        </h1>
        <p>Пройди испытание, чтобы открыть историю нового хранителя.</p>
      </div>
      {!scannedCharacter ? (
        <div className="empty-state">
          <Swords size={42} />
          <h2>Сначала найди метку хранителя</h2>
          <p>Бой начинается автоматически после успешного сканирования.</p>
          <Link to="/home" className="button">
            Начать сканирование
            <ArrowRight size={18} />
          </Link>
        </div>
      ) : !battle ? (
        <div className="empty-state">
          <Swords size={42} />
          <h2>Испытание ещё не началось</h2>
          <p>Отсканируй метку — бой запустится автоматически.</p>
          <Link to="/home" className="button">
            Начать сканирование <ArrowRight size={18} />
          </Link>
        </div>
      ) : (
        <>
          <section className="arena">
            <div className="arena-top">
              <span>ТРЕНИРОВОЧНАЯ ПОЛЯНА</span>
              <span>
                {active ? `Раунд ${battle.turn} / 40` : 'Поединок завершён'}
              </span>
            </div>
            <div className="arena-huds">
              <FighterHud fighter={battle.player} />
              <span className="versus">VS</span>
              <FighterHud fighter={battle.enemy} />
            </div>
            <div className="battle-scene">
              <Suspense fallback={<span role="status">Готовим арену…</span>}>
                <BattleCanvas
                  key={battle.id}
                  battle={battle}
                  entities={characters}
                />
              </Suspense>
              {feedback && (
                <div
                  className="damage-announcement"
                  key={`${battle.id}-${feedback.turn}`}
                  role="status"
                  data-testid="battle-feedback"
                  data-turn={feedback.turn}
                >
                  {feedback.enemyDamage > 0 && (
                    <span className="damage-number enemy-damage">
                      −{feedback.enemyDamage} HP соперника
                    </span>
                  )}
                  {feedback.playerDamage > 0 && (
                    <span className="damage-number player-damage">
                      −{feedback.playerDamage} HP хранителя
                    </span>
                  )}
                </div>
              )}
            </div>
            <div className="arena-caption">
              {active
                ? `Соперник готовит: ${actionLabels[enemyIntent(battle.turn)]}`
                : battle.status === 'won'
                  ? 'История твоей победы начинается здесь.'
                  : 'Новая тактика — новая история.'}
            </div>
          </section>
          {active ? (
            <section className="battle-controls">
              <div className="energy-line">
                <Zap size={16} /> Энергия: {battle.player.energy} / 5
              </div>
              <div className="battle-actions">
                {[
                  {
                    action: 'attack' as const,
                    icon: Swords,
                    detail: '+1 энергия',
                  },
                  {
                    action: 'guard' as const,
                    icon: Shield,
                    detail: '−70% входящего урона · +1 энергия',
                  },
                  {
                    action: 'skill' as const,
                    icon: Zap,
                    detail: 'Двойной урон · 3 энергии',
                  },
                ].map(({ action, icon: Icon, detail }) => (
                  <button
                    key={action}
                    disabled={
                      busy ||
                      animating ||
                      !ready ||
                      (action === 'skill' && battle.player.energy < 3)
                    }
                    onClick={async () => {
                      if (actionLock.current) return
                      actionLock.current = true
                      setAnimating(true)
                      await run({
                        type: 'battleTurn',
                        battleId: battle.id,
                        turn: battle.turn,
                        action,
                      })
                      const next = useGame.getState().progress.battle
                      setFeedback(next ? getBattleFeedback(battle, next) : null)
                      timer.current = setTimeout(() => {
                        actionLock.current = false
                        setAnimating(false)
                        setFeedback(null)
                      }, 1200)
                    }}
                  >
                    <Icon size={22} />
                    <b>{actionLabels[action]}</b>
                    <small>{detail}</small>
                  </button>
                ))}
              </div>
            </section>
          ) : (
            <div className="callout battle-result" role="status">
              <Trophy size={34} />
              <div>
                <h2>
                  {battle.status === 'won'
                    ? 'Победа!'
                    : 'Хорошая попытка!'}
                </h2>
                <p>
                  {battle.status === 'won'
                    ? 'Соперник усмирён. История хранителя открыта.'
                    : 'Хранитель готов попробовать снова. Ты ничего не теряешь.'}
                </p>
              </div>
              <Link className="button" to={`/entity/${scannedCharacter.id}`}>
                О герое <ArrowRight size={16} />
              </Link>
            </div>
          )}
          <details className="battle-log" open>
            <summary>Хроника поединка</summary>
            <div role="log" aria-live="polite">
              {battle.log.map((line, i) => (
                <p key={`${i}-${line}`}>{line}</p>
              ))}
            </div>
          </details>
        </>
      )}
      <p className="muted">Пошаговое испытание · до 40 раундов</p>
    </>
  )
}
