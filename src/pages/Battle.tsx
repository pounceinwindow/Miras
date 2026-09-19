import { useMemo } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'

const heroAliases: Record<string, string> = {
  'su-anasy': 'su_anasy',
  su_anasy: 'su_anasy',
  shurale: 'shurale',
  syuyumbike: 'syuyumbike',
  kereml: 'kremlin',
  kremlin: 'kremlin',
}

export default function Battle() {
  const { character = 'su-anasy' } = useParams()
  const [searchParams] = useSearchParams()
  const source = useMemo(() => {
    const player = heroAliases[character] ?? 'su_anasy'
    const enemy = heroAliases[searchParams.get('enemy') ?? '']
    const params = new URLSearchParams({ player })
    if (enemy) params.set('enemy', enemy)
    return `/fighting/index.html?${params}`
  }, [character, searchParams])

  return (
    <section className="fighting-embed" aria-label="Бой хранителей">
      <iframe
        src={source}
        title="Три русла — бой хранителей"
        allow="autoplay; fullscreen"
      />
    </section>
  )
}
