import { Link } from 'react-router-dom'
import {
  ArrowRight,
  LockKeyhole,
  TrendingUp,
  Hexagon,
  Swords,
} from 'lucide-react'
import { useGame } from '../store/game'
import { CharacterArt } from '../components/CharacterArt'
export default function Collection() {
  const characters = useGame((s) => s.entities)
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
            <p>Узнай историю первого хранителя и ответь на три вопроса.</p>
          </div>
          <Link className="button" to="/encounter/forest-01">
            Найти Шурале
            <ArrowRight size={18} />
          </Link>
        </div>
      )}
      <div className="collection-grid">
        {characters.map((c) => {
          const owned = progress.collection.find((o) => o.id === c.id)
          const cost = c.nextUpgradeCost ?? 0
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
                <h2>
                  <Link to={`/entity/${c.id}`}>{c.name}</Link>
                </h2>
                <p>{c.description}</p>
                <Link
                  className="text-link entity-detail-link"
                  to={`/entity/${c.id}`}
                >
                  О хранителе <ArrowRight size={16} />
                </Link>
                {owned ? (
                  <>
                    <div className="stats-row">
                      <span>
                        Здоровье <b>{c.hp}</b>
                      </span>
                      <span>
                        Атака <b>{c.attack}</b>
                      </span>
                    </div>
                    <button
                      className="button"
                      disabled={
                        busy ||
                        !ready ||
                        c.nextUpgradeCost === null ||
                        progress.balance < cost
                      }
                      onClick={() =>
                        void run({ type: 'upgrade', characterId: c.id })
                      }
                    >
                      <TrendingUp size={17} />
                      {c.nextUpgradeCost === null
                        ? 'Максимальный уровень'
                        : `Улучшить · ${cost}`}{' '}
                      {c.nextUpgradeCost !== null && <Hexagon size={15} />}
                    </button>
                    {c.nextUpgradeCost !== null && progress.balance < cost && (
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
