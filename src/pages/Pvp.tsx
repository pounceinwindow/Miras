import { useCallback, useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import {
  Check,
  Copy,
  Crown,
  Shield,
  Sparkles,
  Swords,
  UsersRound,
} from 'lucide-react'
import type { CharacterId } from '../../shared/types'
import { getCharacter } from '../../shared/characters'
import { CharacterArt } from '../components/CharacterArt'
import { authorizedRequest, isCloud } from '../lib/api'
import { useGame } from '../store/game'

interface PvpProfile {
  name: string
  code: string
  wins: number
}
interface LeaderboardEntry {
  rank: number
  name: string
  wins: number
}
type PvpMove = 'attack' | 'guard' | 'skill'
interface PvpMatch {
  id: string
  code: string
  status: 'waiting' | 'active' | 'completed'
  round: number
  yourScore: number
  opponentScore: number
  yourCharacterId: CharacterId
  opponentCharacterId: CharacterId | null
  opponentName: string | null
  hasSubmittedMove: boolean
  lastRound: {
    yourMove: PvpMove
    opponentMove: PvpMove
    outcome: 'won' | 'lost' | 'draw'
  } | null
  youWon: boolean | null
}

const moveInfo: Record<
  PvpMove,
  { label: string; hint: string; icon: typeof Swords }
> = {
  attack: { label: 'Атака', hint: 'прерывает умение', icon: Swords },
  skill: { label: 'Умение', hint: 'пробивает защиту', icon: Sparkles },
  guard: { label: 'Защита', hint: 'контрит атаку', icon: Shield },
}

export default function Pvp() {
  const { progress, ready } = useGame()
  const [profile, setProfile] = useState<PvpProfile | null>(null)
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [match, setMatch] = useState<PvpMatch | null>(null)
  const [characterId, setCharacterId] = useState<CharacterId>(
    progress.collection[0]?.id ?? 'su-anasy',
  )
  const [joinCode, setJoinCode] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)
  const matchId = match?.id
  const matchStatus = match?.status

  const request = useCallback(
    async <T,>(path: string, init?: RequestInit): Promise<T | null> => {
      try {
        setError('')
        return await authorizedRequest<T>(path, init)
      } catch (requestError) {
        setError(
          requestError instanceof Error
            ? requestError.message
            : 'Не удалось обновить PvP',
        )
        return null
      }
    },
    [],
  )

  const refreshMeta = useCallback(async () => {
    const [nextProfile, nextLeaderboard] = await Promise.all([
      request<PvpProfile>('/api/pvp/me'),
      request<LeaderboardEntry[]>('/api/pvp/leaderboard'),
    ])
    if (nextProfile) {
      setProfile(nextProfile)
      setName(nextProfile.name)
    }
    if (nextLeaderboard) setLeaderboard(nextLeaderboard)
  }, [request])

  useEffect(() => {
    if (!isCloud || !ready) return
    void (async () => {
      setLoading(true)
      await refreshMeta()
      const current = await request<PvpMatch | null>('/api/pvp/matches/current')
      if (current) setMatch(current)
      setLoading(false)
    })()
  }, [ready, refreshMeta, request])

  useEffect(() => {
    if (!matchId || matchStatus === 'completed') return
    const timer = window.setInterval(async () => {
      const next = await request<PvpMatch>(`/api/pvp/matches/${matchId}`)
      if (!next) return
      setMatch(next)
      if (next.status === 'completed') void refreshMeta()
    }, 1000)
    return () => window.clearInterval(timer)
  }, [matchId, matchStatus, refreshMeta, request])

  const perform = async (path: string, body: unknown) => {
    setLoading(true)
    const next = await request<PvpMatch>(path, {
      method: 'POST',
      body: JSON.stringify(body),
    })
    if (next) setMatch(next)
    setLoading(false)
  }

  if (!isCloud)
    return (
      <div className="empty-state">
        <UsersRound size={42} />
        <h1>PvP работает через C# сервер</h1>
        <p>
          Запусти API и укажи <code>VITE_API_URL</code>. Для игры с другом нужны
          две разные сессии браузера.
        </p>
      </div>
    )

  return (
    <>
      <div className="page-heading">
        <span className="eyebrow">ДРУЖЕСКИЙ PvP · ДО ДВУХ МИНУТ</span>
        <h1>
          Испытайте друг друга<span>.</span>
        </h1>
        <p>
          Создай комнату и передай код другу. Выбирайте приёмы одновременно:
          атака прерывает умение, умение пробивает защиту, защита контрит атаку.
          Первый с двумя очками побеждает.
        </p>
      </div>

      {error && <div className="error-banner pvp-error">{error}</div>}

      <div className="pvp-layout">
        <section className="panel pvp-main">
          {!match ? (
            <>
              <div className="pvp-profile-row">
                <div>
                  <span className="eyebrow">ТВОЙ ПРОФИЛЬ</span>
                  <h2>{profile?.name ?? 'Загрузка…'}</h2>
                  <p>
                    Код игрока: <b>{profile?.code ?? '—'}</b> · побед:{' '}
                    <b>
                      {profile?.wins ?? progress.pvpWins}
                      {profile?.name === 'prince' ? ' (100 %)' : ''}
                    </b>
                  </p>
                </div>
                <form
                  onSubmit={async (event: FormEvent) => {
                    event.preventDefault()
                    const next = await request<PvpProfile>('/api/pvp/me', {
                      method: 'PUT',
                      body: JSON.stringify({ name }),
                    })
                    if (next) setProfile(next)
                  }}
                >
                  <label htmlFor="pvp-name">Имя в таблице</label>
                  <div className="pvp-inline-form">
                    <input
                      id="pvp-name"
                      value={name}
                      maxLength={24}
                      onChange={(event) => setName(event.target.value)}
                    />
                    <button className="button secondary" disabled={loading}>
                      Сохранить
                    </button>
                  </div>
                </form>
              </div>

              <span className="eyebrow">ВЫБЕРИ ХРАНИТЕЛЯ</span>
              <div className="pvp-character-picker">
                {progress.collection.map((owned) => (
                  <button
                    key={owned.id}
                    className={characterId === owned.id ? 'selected' : ''}
                    onClick={() => setCharacterId(owned.id)}
                  >
                    <CharacterArt id={owned.id} />
                    <b>{getCharacter(owned.id)?.name}</b>
                  </button>
                ))}
              </div>

              <div className="pvp-room-actions">
                <button
                  className="button"
                  disabled={loading || !ready}
                  onClick={() =>
                    void perform('/api/pvp/matches', { characterId })
                  }
                >
                  <UsersRound size={18} /> Создать комнату
                </button>
                <span>или</span>
                <div className="pvp-inline-form">
                  <input
                    aria-label="Код комнаты"
                    placeholder="КОД ДРУГА"
                    value={joinCode}
                    maxLength={8}
                    onChange={(event) =>
                      setJoinCode(event.target.value.toUpperCase())
                    }
                  />
                  <button
                    className="button secondary"
                    disabled={loading || joinCode.trim().length < 4}
                    onClick={() =>
                      void perform('/api/pvp/matches/join', {
                        code: joinCode,
                        characterId,
                      })
                    }
                  >
                    Войти
                  </button>
                </div>
              </div>
            </>
          ) : match.status === 'waiting' ? (
            <div className="pvp-waiting">
              <UsersRound size={44} />
              <span className="eyebrow">КОМНАТА ГОТОВА</span>
              <h2>Передай код другу</h2>
              <button
                className="pvp-room-code"
                onClick={async () => {
                  await navigator.clipboard.writeText(match.code)
                  setCopied(true)
                }}
              >
                {match.code} {copied ? <Check /> : <Copy />}
              </button>
              <p>Ожидаем второго игрока. Экран обновится автоматически.</p>
              <button
                className="text-link"
                onClick={async () => {
                  const result = await request<{ cancelled: boolean }>(
                    `/api/pvp/matches/${match.id}`,
                    { method: 'DELETE' },
                  )
                  if (result?.cancelled) setMatch(null)
                }}
              >
                Закрыть комнату
              </button>
            </div>
          ) : (
            <PvpArena
              match={match}
              loading={loading}
              onMove={(move) =>
                void perform(`/api/pvp/matches/${match.id}/move`, { move })
              }
              onClose={() => {
                setMatch(null)
                void refreshMeta()
              }}
            />
          )}
        </section>

        <aside className="panel pvp-leaderboard">
          <span className="eyebrow">
            <Crown size={16} /> ЛИДЕРБОРД
          </span>
          <h2>Победы в PvP</h2>
          {leaderboard.length ? (
            <ol>
              {leaderboard.map((entry) => (
                <li key={`${entry.rank}-${entry.name}`}>
                  <span>{entry.rank}</span>
                  <b>{entry.name}</b>
                  <strong>
                    {entry.wins}
                    {entry.name === 'prince' ? ' (100 %)' : ''}
                  </strong>
                </li>
              ))}
            </ol>
          ) : (
            <p className="muted">Первый победитель займёт верхнюю строку.</p>
          )}
        </aside>
      </div>
    </>
  )
}

function PvpArena({
  match,
  loading,
  onMove,
  onClose,
}: {
  match: PvpMatch
  loading: boolean
  onMove: (move: PvpMove) => void
  onClose: () => void
}) {
  if (match.status === 'completed')
    return (
      <div className={`pvp-result ${match.youWon ? 'won' : 'lost'}`}>
        <Crown size={48} />
        <span className="eyebrow">ПОЕДИНОК ЗАВЕРШЁН</span>
        <h2>{match.youWon ? 'Ты победил!' : 'Друг оказался сильнее'}</h2>
        <p>
          Финальный счёт {match.yourScore}:{match.opponentScore}. Победа уже
          учтена в лидерборде.
        </p>
        <button className="button" onClick={onClose}>
          Новый поединок
        </button>
      </div>
    )

  return (
    <div className="pvp-arena">
      <div className="pvp-score">
        <div>
          <CharacterArt id={match.yourCharacterId} />
          <b>Ты</b>
          <strong>{match.yourScore}</strong>
        </div>
        <span>Раунд {match.round}</span>
        <div>
          {match.opponentCharacterId && (
            <CharacterArt id={match.opponentCharacterId} />
          )}
          <b>{match.opponentName}</b>
          <strong>{match.opponentScore}</strong>
        </div>
      </div>

      {match.lastRound && (
        <div className={`pvp-round-result ${match.lastRound.outcome}`}>
          {match.lastRound.outcome === 'won'
            ? 'Раунд за тобой'
            : match.lastRound.outcome === 'lost'
              ? 'Раунд за другом'
              : 'Одинаковые приёмы — ничья'}
          <small>
            {moveInfo[match.lastRound.yourMove].label} ·{' '}
            {moveInfo[match.lastRound.opponentMove].label}
          </small>
        </div>
      )}

      {match.hasSubmittedMove ? (
        <div className="pvp-move-wait">
          <UsersRound size={28} />
          Приём выбран. Ждём ход друга…
        </div>
      ) : (
        <div className="pvp-moves">
          {(Object.keys(moveInfo) as PvpMove[]).map((move) => {
            const info = moveInfo[move]
            const Icon = info.icon
            return (
              <button
                key={move}
                disabled={loading}
                onClick={() => onMove(move)}
              >
                <Icon size={28} />
                <b>{info.label}</b>
                <small>{info.hint}</small>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
