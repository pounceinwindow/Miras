import { useEffect, useMemo, useRef } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useGame } from '../store/game'
import type { CharacterId } from '../api/types'

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
  const frame = useRef<HTMLIFrameElement>(null)
  const battleFinished = useRef(false)
  const navigate = useNavigate()
  const run = useGame((state) => state.run)
  const source = useMemo(() => {
    const player = heroAliases[character] ?? 'su_anasy'
    const enemy = heroAliases[searchParams.get('enemy') ?? '']
    const params = new URLSearchParams({ player })
    if (enemy) params.set('enemy', enemy)
    if (searchParams.get('bonus') === 'true') params.set('bonus', 'true')
    return `/fighting/index.html?${params}`
  }, [character, searchParams])

  useEffect(() => {
    function onMessage(event: MessageEvent) {
      if (
        event.origin !== window.location.origin ||
        event.source !== frame.current?.contentWindow
      )
        return

      if (
        event.data?.type !== 'miras:battle-finished' ||
        battleFinished.current
      )
        return

      battleFinished.current = true
      if (event.data?.result === 'win') {
        const enemyId = appHeroIds[event.data?.enemy]
        if (enemyId) {
          void run({
            type: 'recruit',
            characterId: enemyId,
          })
        }
      }
      navigate('/home', { replace: true })
    }

    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [navigate, run])

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
