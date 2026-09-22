import { useEffect } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { UserRound, Flower2, X, LoaderCircle } from 'lucide-react'
import { useGame } from '../store/game'
import { flushAnalytics, trackEvent } from '../lib/analytics'
export function Layout() {
  const { error, busy, ready, run, clearError } = useGame()
  const location = useLocation()
  useEffect(() => {
    void run({ type: 'sync' })
  }, [run])
  useEffect(() => {
    window.scrollTo(0, 0)
    trackEvent('screen_view', { path: location.pathname })
  }, [location.pathname])
  useEffect(() => {
    if (ready) void flushAnalytics()
  }, [ready])
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
            <span className="avatar" aria-hidden="true">
              <UserRound size={20} />
            </span>
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
    </div>
  )
}
