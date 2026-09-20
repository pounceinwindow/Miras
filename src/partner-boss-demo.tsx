import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import {
  Clock3,
  Flower2,
  Heart,
  Swords,
  TicketPercent,
  UserRound,
} from 'lucide-react'
import './partner-boss-demo.css'

const conditions = [
  'Победить босса',
  'Получить уникальный купон',
  'Показать купон сотруднику ресторана',
  'Купон действует 24 часа',
  'Один купон на аккаунт',
]

export function PartnerBossDemo() {
  return (
    <main className="partner-boss-page">
      <header className="partner-masthead">
        <div className="partner-brand">
          <Flower2 className="partner-brand-mark" size={27} strokeWidth={1.8} />
          Мирас<span>®</span>
        </div>
        <div className="partner-header-right">
          <span className="partner-avatar" aria-hidden="true">
            <UserRound size={20} />
          </span>
        </div>
      </header>

      <section className="boss-hero" aria-labelledby="boss-name">
        <img
          className="boss-venue"
          src="/partner/restaurant-kazan.png"
          alt="Интерьер партнёрского ресторана"
        />
        <div className="boss-hero-shade" />
        <div className="boss-ornament boss-ornament-left" aria-hidden="true" />
        <div className="boss-ornament boss-ornament-right" aria-hidden="true" />

        <blockquote className="boss-speech">
          <p lang="tt">Кунак булып килдеңме? Ташламаны җиңеп ал!</p>
          <footer>Пришёл в гости? Тогда заслужи свою скидку!</footer>
        </blockquote>

        <img
          className="boss-sprite"
          src="/partner/chak-chakich.png"
          alt="Чак-чакич"
        />
      </section>

      <article className="boss-sheet">
        <div className="boss-identity">
          <span>Партнёрский босс • Ресторан</span>
          <h1 id="boss-name">Чак-чакич</h1>
        </div>

        <section className="reward-card" aria-labelledby="reward-title">
          <div className="reward-seal">
            <TicketPercent size={25} />
          </div>
          <div>
            <span id="reward-title">Награда за победу</span>
            <strong>−20% <small>на весь заказ</small></strong>
            <p>Действует при заказе от 1500 ₽</p>
          </div>
        </section>

        <section className="boss-stats" aria-label="Характеристики босса">
          <div><span><Heart size={13} /> Здоровье</span><strong>850 HP</strong></div>
          <div><span>Сложность</span><strong className="boss-stars">★★★<span>★★</span></strong></div>
          <div><span><Clock3 size={13} /> Попыток в день</span><strong>3</strong></div>
        </section>

        <section className="boss-section reward-terms" aria-labelledby="terms-title">
          <div className="boss-section-title">
            <h2 id="terms-title">Как получить награду</h2>
          </div>
          <ol>
            {conditions.map((condition, index) => (
              <li key={condition}>
                <span>{index + 1}</span>{condition}
              </li>
            ))}
          </ol>
        </section>

        <section className="boss-cta" aria-label="Вызов боссу">
          <button type="button"><Swords size={20} /> Бросить вызов</button>
        </section>
      </article>
    </main>
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <PartnerBossDemo />
  </StrictMode>,
)
