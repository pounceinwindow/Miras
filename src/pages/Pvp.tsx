import { useMemo } from 'react'
import { ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useGame } from '../store/game'

const heroAliases: Record<string, string> = {
  'su-anasy': 'su_anasy',
  shurale: 'shurale',
  syuyumbike: 'syuyumbike',
  kereml: 'kremlin',
}

export default function Pvp() {
  const collection = useGame((state) => state.progress.collection)
  const source = useMemo(() => {
    const owned = collection[0]?.id ?? 'su-anasy'
    const player = heroAliases[owned] ?? 'su_anasy'
    return `/fighting/index.html?${new URLSearchParams({
      mode: 'pvp',
      player,
      build: 'pvp-3',
    })}`
  }, [collection])

  return (
    <>
      <Link className="back-link battle-back-link" to="/home">
        <ArrowLeft size={17} /> На главную
      </Link>
      <section className="fighting-embed" aria-label="PvP-бой хранителей">
        <iframe
          src={source}
          title="Три русла — PvP между игроками"
          allow="autoplay; fullscreen"
        />
      </section>
    </>
  )
}
