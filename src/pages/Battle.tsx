import { lazy, Suspense, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Swords, Shield, Zap, ArrowRight, Trophy } from 'lucide-react'
import { characters, getCharacter } from '../../shared/characters'
import { enemyIntent } from '../../shared/battle'
import type { CharacterId, Fighter } from '../../shared/types'
import { useGame } from '../store/game'
import { CharacterArt } from '../components/CharacterArt'
const BattleCanvas = lazy(() => import('../components/BattleCanvas'))
const actionLabels = { attack: 'Атака', guard: 'Защита', skill: 'Особый приём' }
function FighterHud({ fighter }: { fighter: Fighter }) {
  return (
    <div className="fighter-hud">
      <div>
        <b>{getCharacter(fighter.id)?.name}</b>
        <span>Ур. {fighter.level}</span>
      </div>
      <progress
        value={fighter.hp}
        max={fighter.maxHp}
        aria-label={`Здоровье ${getCharacter(fighter.id)?.name}`}
      />
      <small>
        {fighter.hp} / {fighter.maxHp} здоровья
      </small>
    </div>
  )
}
export default function Battle() {
  const { progress, run, busy, ready } = useGame()
  const [params] = useSearchParams()
  const [selected, setSelected] = useState<CharacterId | null>(null)
  const [choosing, setChoosing] = useState(false)
  const battle = progress.battle
  const active = battle?.status === 'active'
  const selection =
    selected ??
    progress.collection.find((c) => c.id === params.get('character'))?.id ??
    progress.collection[0]?.id
  return (
    <>
      <div className="page-heading">
        <span className="eyebrow">СИЛА В ИСТОРИИ. ПОБЕДА В ТАКТИКЕ.</span>
        <h1>
          Дружеский поединок<span>.</span>
        </h1>
        <p>
          Проверь своего хранителя в тренировочном бою. За победу — 25 чак-чака.
        </p>
      </div>
      {!progress.collection.length ? (
        <div className="empty-state">
          <Swords size={42} />
          <h2>Твоему приключению нужен хранитель</h2>
          <p>Сначала познакомься с одним из героев на карте.</p>
          <Link to="/" className="button">
            Найти хранителя
            <ArrowRight size={18} />
          </Link>
        </div>
      ) : !battle || (choosing && !active) ? (
        <section className="panel">
          <h2>Кто отправится на арену?</h2>
          <div className="fighter-selection">
            {progress.collection.map((c) => (
              <button
                key={c.id}
                className={selection === c.id ? 'selected' : ''}
                onClick={() => setSelected(c.id)}
                aria-pressed={selection === c.id}
              >
                <CharacterArt id={c.id} />
                <b>{getCharacter(c.id)?.name}</b>
                <span>Уровень {c.level}</span>
              </button>
            ))}
          </div>
          <button
            className="button"
            disabled={busy || !ready || !selection}
            onClick={async () => {
              if (selection) {
                await run({ type: 'startBattle', characterId: selection })
                setChoosing(false)
              }
            }}
          >
            <Swords size={18} /> Начать поединок
          </button>
          <p className="muted">
            Соперник того же уровня. Ход противника виден заранее: защищайся от
            сильных приёмов.
          </p>
        </section>
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
              <Suspense fallback={null}>
                <BattleCanvas turn={battle.turn} />
              </Suspense>
              <div
                className={`battle-character player ${battle.player.hp === 0 ? 'defeated' : ''}`}
              >
                <CharacterArt id={battle.player.id} />
              </div>
              <div
                className={`battle-character enemy ${battle.enemy.hp === 0 ? 'defeated' : ''}`}
              >
                <CharacterArt id={battle.enemy.id} />
              </div>
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
                      !ready ||
                      (action === 'skill' && battle.player.energy < 3)
                    }
                    onClick={() =>
                      void run({
                        type: 'battleTurn',
                        battleId: battle.id,
                        turn: battle.turn,
                        action,
                      })
                    }
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
                    ? 'Победа! +25 чак-чака'
                    : 'Хорошая попытка!'}
                </h2>
                <p>
                  {battle.status === 'won'
                    ? 'Награда уже в кошельке. Можно улучшить хранителя.'
                    : 'Хранитель готов попробовать снова. Ты ничего не теряешь.'}
                </p>
              </div>
              <button className="button" onClick={() => setChoosing(true)}>
                Ещё поединок
              </button>
              <Link className="text-link" to="/collection">
                К коллекции <ArrowRight size={16} />
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
      <p className="muted">
        {characters.length} хранителя · пошаговый бой с ИИ · до 40 раундов · PvP
        появится позже
      </p>
    </>
  )
}
