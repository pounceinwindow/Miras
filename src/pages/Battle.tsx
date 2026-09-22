import { useEffect, useMemo, useRef } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useGame } from '../store/game'
import type { CharacterId } from '../api/types'
import { trackEvent } from '../lib/analytics'

const heroAliases: Record<string, string> = {
  'su-anasy': 'su_anasy',
  su_anasy: 'su_anasy',
  shurale: 'shurale',
  syuyumbike: 'syuyumbike',
  kereml: 'kremlin',
  kremlin: 'kremlin',
}

const appHeroIds: Record<string, CharacterId> = {
  su_anasy: 'su-anasy',
  shurale: 'shurale',
  syuyumbike: 'syuyumbike',
  kremlin: 'kereml',
}

export default function Battle() {
  const { character = 'su-anasy' } = useParams()
  const [searchParams] = useSearchParams()
  const requestedEnemy = searchParams.get('enemy') ?? ''
  const frame = useRef<HTMLIFrameElement>(null)
  const defeatedEnemy = useRef<CharacterId | null>(null)
  const recruitStarted = useRef(false)
  const navigate = useNavigate()
  const run = useGame((state) => state.run)
  const source = useMemo(() => {
    const player = heroAliases[character] ?? 'su_anasy'
    const enemy = heroAliases[requestedEnemy]
    const params = new URLSearchParams({ player })
    if (enemy) params.set('enemy', enemy)
    if (searchParams.get('bonus') === 'true') params.set('bonus', 'true')
    return `/fighting/index.html?${params}`
  }, [character, requestedEnemy, searchParams])

  useEffect(() => {
    trackEvent('battle_started', {
      player_id: character,
      boss_id: requestedEnemy,
    })
  }, [character, requestedEnemy])

  useEffect(() => {
    async function openCollection() {
      const enemyId = defeatedEnemy.current
      if (enemyId && !recruitStarted.current) {
        recruitStarted.current = true
        const alreadyOwned = useGame
          .getState()
          .progress.collection.some((item) => item.id === enemyId)
        if (!alreadyOwned) {
          await run({ type: 'recruit', characterId: enemyId })
        }
      }
      navigate('/home', { replace: true })
    }

    function onMessage(event: MessageEvent) {
      if (
        event.origin !== window.location.origin ||
        event.source !== frame.current?.contentWindow
      )
        return

      if (event.data?.type === 'miras:open-collection') {
        void openCollection()
        return
      }

      if (event.data?.type !== 'miras:battle-finished') return
      trackEvent('battle_finished', {
        boss_id: requestedEnemy,
        result: String(event.data.result ?? 'unknown'),
        duration_sec: Number(event.data.duration_sec ?? 0),
      })
      if (event.data?.result === 'win')
        defeatedEnemy.current = appHeroIds[event.data?.enemy] ?? null
    }

    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [navigate, requestedEnemy, run])

  return (
    <div className="battle-page">
      <section className="fighting-embed" aria-label="Бой хранителей">
        <iframe
          ref={frame}
          src={source}
          title="Три русла — бой хранителей"
          allow="autoplay; fullscreen"
        />
      </section>
    </div>
  )
}
