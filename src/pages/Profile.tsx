import { useState } from 'react'
import { Link } from 'react-router-dom'
import { BookOpen, Trophy, ArrowLeft, Nfc, Copy, Check } from 'lucide-react'
import { useGame } from '../store/game'
import { isCloud } from '../api/client'
export default function Profile() {
  const characters = useGame((s) => s.entities)
  const { progress, resetDemo, busy } = useGame()
  const [confirm, setConfirm] = useState(false)
  const [copied, setCopied] = useState('')
  const [copyError, setCopyError] = useState(false)
  return (
    <>
      <Link className="back-link" to="/home">
        <ArrowLeft size={17} /> На главную
      </Link>
      <div className="page-heading">
        <span className="eyebrow">ТВОЯ СОБСТВЕННАЯ ИСТОРИЯ</span>
        <h1>
          Путь исследователя<span>.</span>
        </h1>
        <p>
          {isCloud
            ? 'Прогресс сохраняется на C# сервере. Гостевой вход привязан к этому браузеру.'
            : 'Деморежим: прогресс сохраняется только в этом браузере.'}
        </p>
      </div>
      <div className="profile-stats">
        {[
          {
            icon: BookOpen,
            value: `${progress.collection.length}/4`,
            label: 'Хранителей найдено',
          },
          { icon: Trophy, value: progress.wins, label: 'Побед в поединках' },
        ].map(({ icon: Icon, value, label }) => (
          <div className="stat-card" key={label}>
            <Icon size={24} />
            <strong>{value}</strong>
            <span>{label}</span>
          </div>
        ))}
      </div>
      <section className="panel">
        <span className="eyebrow">
          <Nfc size={16} /> ДЛЯ ДЕМОНСТРАЦИИ
        </span>
        <h2>Четыре метки — четыре истории</h2>
        <p>
          Запиши ссылку на NFC-метку как NDEF URI. Телефон откроет встречу в
          браузере. На телефоне используй HTTPS-адрес опубликованного
          приложения.
        </p>
        <div className="tag-list">
          {characters.map((c) => (
            <div key={c.id}>
              <div>
                <b>{c.name}</b>
                <Link to={`/encounter/${c.tag}`}>/encounter/{c.tag}</Link>
              </div>
              <button
                className="icon-button"
                aria-label={`Копировать ссылку: ${c.name}`}
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(
                      `${location.origin}/encounter/${c.tag}`,
                    )
                    setCopied(c.id)
                    setCopyError(false)
                  } catch {
                    setCopyError(true)
                  }
                }}
              >
                {copied === c.id ? <Check size={18} /> : <Copy size={18} />}
              </button>
            </div>
          ))}
        </div>
        <span role="status" className="muted">
          {copyError
            ? 'Не удалось скопировать. Открой ссылку и скопируй адрес из браузера.'
            : copied
              ? 'Ссылка скопирована.'
              : ''}
        </span>
      </section>
      <section className="panel">
        <h2>О мире Мирас</h2>
        <p>
          Мирас — «наследие». Здесь фольклор встречается с городским
          приключением. Источники указаны в историях; придуманные детали и
          персонажи обозначены отдельно.
        </p>
        <p>
          Места на карте условные. Не нужно подходить к воде или заходить на
          закрытые территории: для настоящего маршрута команда размещает метки в
          доступных местах.
        </p>
      </section>
      {!isCloud && (
        <section className="panel">
          <h2>Начать демо заново</h2>
          <p>
            Удалит локальную коллекцию и историю поединков.
          </p>
          {confirm ? (
            <div className="button-row">
              <button
                disabled={busy}
                className="button danger"
                onClick={() => {
                  resetDemo()
                  setConfirm(false)
                }}
              >
                Удалить демопрогресс
              </button>
              <button
                className="button secondary"
                onClick={() => setConfirm(false)}
              >
                Отмена
              </button>
            </div>
          ) : (
            <button
              className="button secondary"
              onClick={() => setConfirm(true)}
            >
              Сбросить демо
            </button>
          )}
        </section>
      )}
    </>
  )
}
