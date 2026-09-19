import { useEffect } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import {
  House,
  Map,
  UserRound,
  Flower2,
  X,
  LoaderCircle,
  BookOpen,
} from 'lucide-react'
import { useGame } from '../store/game'
const nav = [
  { to: '/home', label: 'Главная', icon: House },
  { to: '/map', label: 'Карта', icon: Map },
  { to: '/collection', label: 'Бойцы', icon: BookOpen },
]
export function Layout() {
  const { progress, error, busy, ready, run, clearError } = useGame()
  const location = useLocation()
  useEffect(() => {
    void run({ type: 'sync' })
  }, [run])
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [location.pathname])
  return (
    <div className="app-shell mobile-app">
      <a className="skip-link" href="#main">
        К содержимому
      </a>
      <div className="main-shell">
        <header className="topbar">
          <NavLink
            to="/home"
            className="mobile-brand"
            aria-label="Мирас — главная"
          >
            <Flower2 size={27} strokeWidth={1.8} />
            Мирас<span>®</span>
          </NavLink>
          <div className="topbar-right">
            {busy && (
              <LoaderCircle className="spin" size={16} aria-label="Загрузка" />
            )}
            <span
              className="balance"
              aria-label={`${progress.balance} чак-чаков`}
              title="Чак-чаки — игровая валюта"
            >
              <span className="chakchak" aria-hidden="true">
                ✦
              </span>
              <b>{progress.balance}</b>
              <span>чак-чак</span>
            </span>
            <NavLink to="/profile" className="avatar" aria-label="Мой профиль">
              <UserRound size={20} />
            </NavLink>
          </div>
        </header>
        {error && (
          <div className="error-banner" role="alert">
            <span>{error}</span>
            <button disabled={busy} onClick={() => void run({ type: 'sync' })}>
              Повторить
            </button>
            <button onClick={clearError} aria-label="Закрыть ошибку">
              <X size={18} />
            </button>
          </div>
        )}
        <main id="main" tabIndex={-1}>
          {ready ? (
            <Outlet />
          ) : (
            <div className="panel" role="status">
              Загружаем мир Мирас…
            </div>
          )}
        </main>
      </div>
      <nav className="bottom-nav" aria-label="Главная навигация">
        {nav.map(({ to, label, icon: Icon }) => (
          <NavLink key={to} to={to}>
            <Icon size={21} strokeWidth={1.7} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
