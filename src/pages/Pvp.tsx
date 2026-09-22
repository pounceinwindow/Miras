import { useEffect, useMemo, useRef } from 'react'
import { ArrowLeft } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { useGame } from '../store/game'
import { trackEvent } from '../lib/analytics'

const heroAliases: Record<string, string> = {
  'su-anasy': 'su_anasy',
  shurale: 'shurale',
  syuyumbike: 'syuyumbike',
  kereml: 'kremlin',
}

export default function Pvp() {
  const collection = useGame((state) => state.progress.collection)
  const frame = useRef<HTMLIFrameElement>(null)
  const navigate = useNavigate()
  const source = useMemo(() => {
    const owned = collection[0]?.id ?? 'su-anasy'
    const player = heroAliases[owned] ?? 'su_anasy'
    return `/fighting/index.html?${new URLSearchParams({
      mode: 'pvp',
      player,
      build: 'pvp-3',
    })}`
  }, [collection])

  useEffect(() => {
    trackEvent('pvp_opened')
  }, [])

  useEffect(() => {
    function onMessage(event: MessageEvent) {
      if (
        event.origin === window.location.origin &&
        event.source === frame.current?.contentWindow &&
        event.data?.type === 'miras:battle-finished'
      ) {
        navigate('/home', { replace: true })
      }
    }

    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [navigate])

  return (
    <>
      <Link className="back-link battle-back-link" to="/home">
        <ArrowLeft size={17} /> На главную
      </Link>
      <section className="fighting-embed" aria-label="PvP-бой хранителей">
        <iframe
          ref={frame}
          src={source}
          title="Три русла — PvP между игроками"
          allow="autoplay; fullscreen"
        />
      </section>
    </>
  )
}
