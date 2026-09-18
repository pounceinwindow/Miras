import { Link } from 'react-router-dom'
import {
  ArrowRight,
  LockKeyhole,
  TrendingUp,
  Hexagon,
  Swords,
} from 'lucide-react'
import { characters, MAX_LEVEL, upgradeCost } from '../../shared/characters'
import { useGame } from '../store/game'
import { CharacterArt } from '../components/CharacterArt'
export default function Collection() {
  const { progress, run, busy, ready } = useGame()
  return (
    <>
      <div className="page-heading">
        <span className="eyebrow">ИСТОРИИ, КОТОРЫЕ ТЕПЕРЬ С ТОБОЙ</span>
        <h1>
          Твои хранители<span>.</span>
        </h1>
        <p>
          Найдено {progress.collection.length} из 4. Побеждай в поединках и
          помогай им становиться сильнее.
        </p>
      </div>
      {!progress.collection.length && (
        <div className="callout">
          <div>
            <h2>Каждая дружба начинается со встречи</h2>
            <p>Су анасы должна выдаваться при первом входе. Обнови прогресс.</p>
          </div>
          <Link className="button" to="/">
            Вернуться на карту
            <ArrowRight size={18} />
          </Link>
        </div>
      )}
      <div className="collection-grid">
        {characters.map((c) => {
          const owned = progress.collection.find((o) => o.id === c.id)
          const cost = owned ? upgradeCost(owned.level) : 0
          return (
            <article
              key={c.id}
              className={`collection-card ${owned ? '' : 'uncollected'}`}
            >
              <div className={`collection-art art-${c.id}`}>
                <span className="pill dark">
                  {owned ? `Уровень ${owned.level}` : 'Ещё не знакомы'}
                </span>
                <CharacterArt id={c.id} />
              </div>
              <div className="collection-info">
                <span className="eyebrow">
                  {c.element} · {c.kind}
                </span>
                <h2>{c.name}</h2>
                <p>{c.description}</p>
                {owned ? (
                  <>
                    <div className="stats-row">
                      <span>
                        Здоровье <b>{c.health + (owned.level - 1) * 12}</b>
                      </span>
                      <span>
                        Атака <b>{c.attack + (owned.level - 1) * 3}</b>
                      </span>
                    </div>
                    <button
                      className="button"
                      disabled={
                        busy ||
                        !ready ||
                        owned.level >= MAX_LEVEL ||
                        progress.balance < cost
                      }
                      onClick={() =>
                        void run({ type: 'upgrade', characterId: c.id })
                      }
                    >
                      <TrendingUp size={17} />
                      {owned.level >= MAX_LEVEL
                        ? 'Максимальный уровень'
                        : `Улучшить · ${cost}`}{' '}
                      {owned.level < MAX_LEVEL && <Hexagon size={15} />}
                    </button>
                    {owned.level < MAX_LEVEL && progress.balance < cost && (
                      <small className="muted">
                        Не хватает {cost - progress.balance} чак-чака. Награда
                        за победу — 25.
                      </small>
                    )}
                    <Link
                      to={`/battle?character=${c.id}`}
                      className="text-link"
                    >
                      <Swords size={17} /> Выбрать для поединка
                    </Link>
                  </>
                ) : (
                  <Link to={`/encounter/${c.tag}`} className="button secondary">
                    <LockKeyhole size={17} /> Познакомиться
                  </Link>
                )}
              </div>
            </article>
          )
        })}
      </div>
    </>
  )
}
