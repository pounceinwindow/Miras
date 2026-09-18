import { Link } from 'react-router-dom'
import {
  ArrowUpRight,
  ArrowRight,
  Nfc,
  BookOpen,
  Sparkles,
  Check,
  MapPin,
} from 'lucide-react'
import { motion } from 'motion/react'
import { characters } from '../../shared/characters'
import { useGame } from '../store/game'
import { CharacterArt } from '../components/CharacterArt'
import { MapScene } from '../components/MapScene'
export default function Explore() {
  const collection = useGame((s) => s.progress.collection)
  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">ОТКРОЙ СВОЁ НАСЛЕДИЕ</span>
          <h1>
            Легенды ближе,
            <br className="mobile-break" /> чем кажется<span>.</span>
          </h1>
          <p>
            Гуляй по городу. Знакомься с историями. Находи своих хранителей.
          </p>
        </div>
        <span className="season-label">
          <Sparkles size={15} /> Глава 01 · Начало пути
        </span>
      </div>
      <div className="explore-grid">
        <section className="map-section">
          <div className="section-title">
            <div>
              <h2>Там, где живут истории</h2>
              <span>4 места для открытий</span>
            </div>
            <Link className="text-link" to="/map">
              Открыть карту <ArrowRight size={16} />
            </Link>
          </div>
          <MapScene />
        </section>
        <motion.section
          className="feature-card"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="feature-top">
            <span className="pill">ПЕРВАЯ ВСТРЕЧА</span>
            <ArrowUpRight size={22} />
          </div>
          <CharacterArt id="shurale" className="feature-art" />
          <span className="feature-kicker">ЛЕС ХРАНИТ СВОИ СЕКРЕТЫ</span>
          <h2>Шурале</h2>
          <p>
            Один шаг с привычной тропы —<br />и ты уже внутри легенды.
          </p>
          <Link className="button cream" to="/encounter/forest-01">
            Встретить хранителя
            <ArrowRight size={18} />
          </Link>
        </motion.section>
      </div>
      <section className="how-strip">
        <div>
          <span className="step-icon">
            <Nfc size={21} />
          </span>
          <p>
            <b>01. Найди</b>
            <span>Поднеси телефон к NFC-метке</span>
          </p>
        </div>
        <div>
          <span className="step-icon">
            <BookOpen size={21} />
          </span>
          <p>
            <b>02. Узнай</b>
            <span>Послушай историю и ответь на вопросы</span>
          </p>
        </div>
        <div>
          <span className="step-icon">
            <Sparkles size={21} />
          </span>
          <p>
            <b>03. Подружись</b>
            <span>Собирай и развивай хранителей</span>
          </p>
        </div>
      </section>
      <section>
        <div className="section-title">
          <div>
            <span className="eyebrow">ЧЕТЫРЕ ИСТОРИИ · ОДНО НАСЛЕДИЕ</span>
            <h2>Хранители Татарстана</h2>
          </div>
          <Link className="text-link" to="/collection">
            Моя коллекция <ArrowRight size={16} />
          </Link>
        </div>
        <div className="character-grid">
          {characters.map((c, i) => (
            <motion.div
              key={c.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
            >
              <Link
                to={`/encounter/${c.tag}`}
                className={`character-card art-${c.id}`}
              >
                <div className="character-card-top">
                  <span>{c.element}</span>
                  <span>
                    {collection.some((o) => o.id === c.id) ? (
                      <Check size={18} />
                    ) : (
                      String(i + 1).padStart(2, '0')
                    )}
                  </span>
                </div>
                <CharacterArt id={c.id} />
                <div className="character-card-info">
                  <h3>
                    {c.name}
                    <ArrowUpRight size={18} />
                  </h3>
                  <p>{c.title}</p>
                  <span className="location-line">
                    <MapPin size={12} />
                    {c.location}
                  </span>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>
      <div className="demo-note">
        <Nfc size={18} />
        <span>
          Нет метки под рукой? В прототипе можно открыть встречу прямо с карты
          или карточки.
        </span>
      </div>
    </>
  )
}
