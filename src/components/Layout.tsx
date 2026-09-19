import { useEffect } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import {
  Compass,
  BookOpen,
  Swords,
  UserRound,
  Flower2,
  MapPin,
  X,
  LoaderCircle,
  UsersRound,
} from 'lucide-react'
import { useGame } from '../store/game'
import { isCloud } from '../lib/api'
const nav = [
  { to: '/', label: 'Исследовать', icon: Compass },
  { to: '/collection', label: 'Коллекция', icon: BookOpen },
  { to: '/battle', label: 'Поединки', icon: Swords },
  { to: '/pvp', label: 'С друзьями', icon: UsersRound },
  { to: '/profile', label: 'Мой путь', icon: UserRound },
]
export function Layout() {
  const { progress, error, busy, run, clearError } = useGame()
  const location = useLocation()
  useEffect(() => {
    void run({ type: 'sync' })
  }, [run])
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [location.pathname])
  return (
    <div className="app-shell">
      <a className="skip-link" href="#main">
        К содержимому
      </a>
      <aside className="sidebar">
        <NavLink to="/" className="brand" aria-label="Мирас — главная">
          <Flower2 size={36} />
          <span>
            мирас<small>ЛЕГЕНДЫ РЯДОМ</small>
          </span>
        </NavLink>
        <div className="sidebar-caption">ТВОЁ ПРИКЛЮЧЕНИЕ</div>
        <nav aria-label="Главная навигация">
          {nav.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `nav-link ${isActive ? 'active' : ''}`
              }
            >
              <Icon size={21} />
              <span>{label}</span>
              {to === '/collection' && (
                <small>{progress.collection.length}/4</small>
              )}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <Flower2 size={48} />
          <p>
            У каждой земли —<br />
            свои истории.
          </p>
          <span>Найди свою в Татарстане.</span>
        </div>
        <div className="mode-label">
          <i />
          {isCloud ? 'Серверный режим' : 'Демо-приключение'}
        </div>
      </aside>
      <div className="main-shell">
        <header className="topbar">
          <span className="place">
            <MapPin size={17} /> Казань, Татарстан
          </span>
          <div className="topbar-right">
            {busy && (
              <LoaderCircle className="spin" size={18} aria-label="Загрузка" />
            )}
            <NavLink to="/profile" className="avatar" aria-label="Мой профиль">
              П
            </NavLink>
          </div>
        </header>
        {error && (
          <div className="error-banner" role="alert">
            <span>{error}</span>
            <button disabled={busy} onClick={() => void run({ type: 'sync' })}>
              Обновить прогресс
            </button>
            <button onClick={clearError} aria-label="Закрыть ошибку">
              <X size={18} />
            </button>
          </div>
        )}
        <main id="main" tabIndex={-1}>
          <Outlet />
        </main>
        <footer className="page-footer">
          <span>МИРАС · ХРАНИМ ИСТОРИИ, СОЗДАЁМ СВОЮ</span>
          <span>Прототип / 2026</span>
        </footer>
      </div>
    </div>
  )
}
