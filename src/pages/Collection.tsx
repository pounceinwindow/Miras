import { Link } from 'react-router-dom'
import { ArrowRight, ArrowLeft, LockKeyhole } from 'lucide-react'
import { useGame } from '../store/game'
import { CharacterArt } from '../components/CharacterArt'
export default function Collection() {
  const characters = useGame((s) => s.entities)
  const { progress } = useGame()
  return (
    <>
      <Link className="back-link" to="/home">
        <ArrowLeft size={17} /> На главную
      </Link>
      <div className="page-heading">
        <span className="eyebrow">ИСТОРИИ, КОТОРЫЕ ТЕПЕРЬ С ТОБОЙ</span>
        <h1>
          Твои хранители<span>.</span>
        </h1>
        <p>
          Найдено {progress.collection.length} из 4. Сканируй новые места и
          собирай хранителей.
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
          return (
            <article
              key={c.id}
              className={`collection-card ${owned ? '' : 'uncollected'}`}
            >
              <div className={`collection-art art-${c.id}`}>
                <span className="pill dark">
                  {owned ? 'В коллекции' : 'Ещё не знакомы'}
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
                  <div className="stats-row">
                    <span>
                      Здоровье <b>{c.hp}</b>
                    </span>
                    <span>
                      Атака <b>{c.attack}</b>
                    </span>
                  </div>
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
