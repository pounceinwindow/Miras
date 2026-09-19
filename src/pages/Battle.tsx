import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  ArrowLeft,
  Clock3,
  Footprints,
  Shield,
  Sparkles,
  Swords,
} from 'lucide-react'
import { characters, getCharacter } from '../../shared/characters'
import { rules, statuses } from '../../shared/pve/engine'
import type { SkillId } from '../../shared/pve/engine'
import type { CharacterId } from '../../shared/types'
import { CharacterArt } from '../components/CharacterArt'
import { useGame } from '../store/game'

const laneNames = ['Слева', 'Центр', 'Справа']

export default function Battle() {
  const { progress, run, ready } = useGame()
  const [params] = useSearchParams()
  const requestedTarget = params.get('target') as CharacterId | null
  const encounter = params.get('mode') === 'encounter'
  const tagId = params.get('tag') ?? undefined
  const owned = progress.collection[0]
  const [party, setParty] = useState<CharacterId[]>(() =>
    progress.collection.slice(0, 3).map((item) => item.id),
  )
  const [target, setTarget] = useState<CharacterId>(
    requestedTarget ?? 'shurale',
  )
  const battle = progress.pve
  const battleId = battle?.id
  const battleStatus = battle?.status

  useEffect(() => {
    if (!battleId || battleStatus !== 'active') return
    void run({ type: 'pve', battleId, action: 'resume' })
    const timer = window.setInterval(
      () => void run({ type: 'pve', battleId, action: 'poll' }),
      200,
    )
    const visibility = () =>
      void run({
        type: 'pve',
        battleId,
        action: document.hidden ? 'pause' : 'resume',
      })
    document.addEventListener('visibilitychange', visibility)
    return () => {
      window.clearInterval(timer)
      document.removeEventListener('visibilitychange', visibility)
    }
  }, [battleId, battleStatus, run])

  useEffect(() => {
    if (!battleId || battleStatus !== 'active') return
    const keyboard = (event: KeyboardEvent) => {
      if (event.repeat) return
      if (['1', '2', '3'].includes(event.key))
        void run({
          type: 'pve',
          battleId,
          action: 'poll',
          input: {
            kind: 'move',
            lane: (Number(event.key) - 1) as 0 | 1 | 2,
          },
        })
      if (event.key.toLowerCase() === 'q' || event.key.toLowerCase() === 'e')
        void run({
          type: 'pve',
          battleId,
          action: 'poll',
          input: {
            kind: 'skill',
            slot: event.key.toLowerCase() === 'q' ? 0 : 1,
          },
        })
    }
    window.addEventListener('keydown', keyboard)
    return () => window.removeEventListener('keydown', keyboard)
  }, [battleId, battleStatus, run])

  const availableTargets = useMemo(
    () =>
      encounter && requestedTarget
        ? characters.filter((item) => item.id === requestedTarget)
        : characters.filter((item) => item.id !== owned?.id),
    [encounter, owned?.id, requestedTarget],
  )

  if (!owned)
    return (
      <div className="empty-state">
        <h1>Сначала выбери стартового хранителя</h1>
        <Link to="/" className="button">
          К началу
        </Link>
      </div>
    )

  if (!battle || (battle.status !== 'active' && battle.target !== target))
    return (
      <>
        <div className="page-heading">
          <span className="eyebrow">PvE · ДО 90 СЕКУНД</span>
          <h1>
            Испытание хранителя<span>.</span>
          </h1>
          <p>
            Двигайся между тремя позициями, читай предупреждения и вовремя
            применяй два умения. Обычная атака происходит автоматически.
          </p>
        </div>
        <section className="panel battle-brief">
          <div>
            <span className="eyebrow">КОМАНДА · ДО ТРЁХ</span>
            <h2>Выбери хранителей</h2>
            <p>Клавиши 1–3 — позиции, Q и E — умения.</p>
          </div>
          <div className="fighter-selection">
            {progress.collection.map((item) => (
              <button
                key={item.id}
                className={party.includes(item.id) ? 'selected' : ''}
                onClick={() =>
                  setParty((current) =>
                    current.includes(item.id)
                      ? current.length > 1
                        ? current.filter((id) => id !== item.id)
                        : current
                      : current.length < 3
                        ? [...current, item.id]
                        : current,
                  )
                }
              >
                <CharacterArt id={item.id} />
                <b>{getCharacter(item.id)?.name}</b>
                <span>Уровень {item.level}</span>
              </button>
            ))}
          </div>
          <span className="eyebrow">БОСС</span>
          <div className="fighter-selection">
            {availableTargets.map((item) => (
              <button
                key={item.id}
                className={target === item.id ? 'selected' : ''}
                onClick={() => setTarget(item.id)}
              >
                <CharacterArt id={item.id} />
                <b>{item.name}</b>
                <span>{item.kind}</span>
              </button>
            ))}
          </div>
          <button
            className="button"
            disabled={!ready || party.length === 0}
            onClick={() =>
              void run({
                type: 'pveStart',
                characterId: party[0],
                party,
                target,
                mode: encounter ? 'encounter' : 'training',
                tagId,
              })
            }
          >
            <Swords size={18} />{' '}
            {encounter ? 'Принять испытание' : 'Начать тренировку'}
          </button>
        </section>
      </>
    )

  const playerSkills = rules.characters[battle.player.id].skills.map(
    (id) => rules.skills[id as SkillId],
  )
  const seconds = Math.max(0, Math.ceil((rules.maxTicks - battle.tick) / 10))
  const playerStatuses = statuses(battle.player, battle.tick)
  const enemyStatuses = statuses(battle.enemy, battle.tick)
  const reserves = battle.reserves ?? []
  const castSkill = (slot: 0 | 1) =>
    void run({
      type: 'pve',
      battleId: battle.id,
      action: 'poll',
      input: { kind: 'skill', slot },
    })

  return (
    <>
      <Link to="/" className="back-link">
        <ArrowLeft size={17} /> Покинуть арену
      </Link>
      <section className="pve-shell">
        <header className="pve-header">
          <FighterBar
            name={getCharacter(battle.player.id)?.name ?? ''}
            hp={battle.player.hp}
            max={battle.player.maxHp}
            statuses={playerStatuses}
          />
          <div className="pve-timer">
            <Clock3 size={17} /> {seconds} сек
          </div>
          <FighterBar
            name={getCharacter(battle.enemy.id)?.name ?? ''}
            hp={battle.enemy.hp}
            max={battle.enemy.maxHp}
            statuses={enemyStatuses}
            enemy
          />
        </header>
        {reserves.length > 0 && (
          <div className="party-switcher">
            <span>Активен: {getCharacter(battle.player.id)?.name}</span>
            {reserves.map((fighter, slot) => (
              <button
                key={`${fighter.id}-${slot}`}
                disabled={fighter.hp <= 0}
                onClick={() =>
                  void run({
                    type: 'pve',
                    battleId: battle.id,
                    action: 'poll',
                    input: { kind: 'switch', slot },
                  })
                }
              >
                {getCharacter(fighter.id)?.name} · {fighter.hp}/{fighter.maxHp}
              </button>
            ))}
          </div>
        )}

        <div className="lane-arena" aria-label="Арена из трёх позиций">
          {[0, 1, 2].map((lane) => {
            const incoming = battle.threats.filter(
              (item) => item.owner === 'enemy' && item.lanes.includes(lane),
            )
            const sealed = battle.seals.some(
              (item) =>
                item.side === 'player' &&
                item.lane === lane &&
                item.until > battle.tick,
            )
            return (
              <button
                key={lane}
                className={`combat-lane ${incoming.length ? 'threatened' : ''} ${sealed ? 'sealed' : ''} ${battle.player.lane === lane ? 'current' : ''}`}
                onClick={() =>
                  void run({
                    type: 'pve',
                    battleId: battle.id,
                    action: 'poll',
                    input: { kind: 'move', lane: lane as 0 | 1 | 2 },
                  })
                }
                disabled={battle.status !== 'active'}
              >
                <span className="lane-name">
                  {lane + 1} · {laneNames[lane]}
                </span>
                {incoming.map((item) => (
                  <span className="threat-marker" key={item.id}>
                    {item.kind === 'shot'
                      ? 'Снаряд'
                      : rules.skills[item.kind].name}{' '}
                    · {Math.max(0, (item.due - battle.tick) / 10).toFixed(1)}
                  </span>
                ))}
                {sealed && <span className="seal-marker">Вход закрыт</span>}
                {battle.enemy.lane === lane && (
                  <div className="lane-fighter enemy">
                    <CharacterArt id={battle.enemy.id} />
                  </div>
                )}
                {battle.player.lane === lane && (
                  <div className="lane-fighter player">
                    <CharacterArt id={battle.player.id} />
                  </div>
                )}
              </button>
            )
          })}
        </div>

        {battle.status === 'active' ? (
          <div className="pve-controls">
            <div className="move-hint">
              <Footprints size={18} /> Нажми на безопасную позицию
            </div>
            {playerSkills.map((skill, slot) => {
              const left = Math.max(
                0,
                (battle.player.skillReady[slot] - battle.tick) / 10,
              )
              return (
                <button
                  key={skill.name}
                  onClick={() => castSkill(slot as 0 | 1)}
                  disabled={left > 0}
                >
                  {slot === 0 ? <Sparkles size={20} /> : <Shield size={20} />}
                  <b>
                    {slot === 0 ? 'Q' : 'E'} · {skill.name}
                  </b>
                  <small>
                    {left > 0 ? `${left.toFixed(1)} сек` : skill.description}
                  </small>
                </button>
              )
            })}
          </div>
        ) : (
          <div className="callout battle-result" role="status">
            <div>
              <span className="eyebrow">
                {battle.status === 'won' ? 'ПОБЕДА' : 'ИСПЫТАНИЕ ОКОНЧЕНО'}
              </span>
              <h2>
                {battle.status === 'won' ? 'Босс побеждён' : 'Попробуй ещё раз'}
              </h2>
              <p>
                {battle.status === 'won' && battle.mode === 'encounter'
                  ? `${getCharacter(battle.target)?.name} теперь в коллекции.`
                  : 'Смена позиции важнее частых нажатий: сначала читай предупреждение.'}
              </p>
            </div>
            <button
              className="button"
              onClick={() =>
                void run({
                  type: 'pveStart',
                  characterId: party[0] ?? owned.id,
                  party,
                  target: battle.target,
                  mode: battle.mode,
                  tagId,
                })
              }
            >
              Повторить
            </button>
            <Link className="text-link" to="/collection">
              К коллекции
            </Link>
          </div>
        )}
      </section>
      <details className="battle-log">
        <summary>Хроника боя</summary>
        {battle.log.map((line, index) => (
          <p key={`${index}-${line}`}>{line}</p>
        ))}
      </details>
    </>
  )
}

function FighterBar({
  name,
  hp,
  max,
  statuses: effects,
  enemy = false,
}: {
  name: string
  hp: number
  max: number
  statuses: string[]
  enemy?: boolean
}) {
  return (
    <div className={`pve-fighter-bar ${enemy ? 'enemy' : ''}`}>
      <div>
        <b>{name}</b>
        <span>
          {hp} / {max}
        </span>
      </div>
      <progress value={hp} max={max} aria-label={`Здоровье: ${name}`} />
      <small>{effects.length ? effects.join(' · ') : 'Нет эффектов'}</small>
    </div>
  )
}
