import { Link } from 'react-router-dom'
export function QueryState({ error }: { error?: string }) {
  return (
    <div className="empty-state" role={error ? 'alert' : 'status'}>
      {error ? (
        <>
          <h1>{error}</h1>
          <p>Выбери хранителя на карте легенд.</p>
          <Link className="button" to="/map">
            К карте
          </Link>
        </>
      ) : (
        <p>Открываем историю…</p>
      )}
    </div>
  )
}
