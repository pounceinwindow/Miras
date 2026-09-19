import { useEffect, useRef, useState } from 'react'
import type { Battle, Entity } from '../api/types'
import { BattleScene } from '../pixi/BattleScene'
import { CharacterArt } from './CharacterArt'
export default function BattleCanvas({
  battle,
  entities,
}: {
  battle: Battle
  entities: Entity[]
}) {
  const host = useRef<HTMLDivElement>(null)
  const scene = useRef<BattleScene | null>(null)
  const initial = useRef(battle)
  const [status, setStatus] = useState<'loading' | 'ready' | 'failed'>(
    'loading',
  )
  const playerImage = entities.find((c) => c.id === battle.player.id)!.imageUrl
  const enemyImage = entities.find((c) => c.id === battle.enemy.id)!.imageUrl
  useEffect(() => {
    const element = host.current
    if (!element) return
    const renderer = new BattleScene(initial.current)
    scene.current = renderer
    let cancelled = false
    void renderer
      .mount(element, playerImage, enemyImage)
      .then(() => {
        if (!cancelled) setStatus('ready')
      })
      .catch(() => {
        renderer.destroy()
        if (!cancelled) setStatus('failed')
      })
    return () => {
      cancelled = true
      scene.current = null
      renderer.destroy()
    }
  }, [playerImage, enemyImage])
  useEffect(() => {
    scene.current?.update(battle)
  }, [battle])
  return (
    <>
      <div className="battle-canvas" data-renderer={status} ref={host} />
      {status !== 'ready' && (
        <>
          <div
            key={`player-${battle.turn}`}
            className={`battle-character player ${battle.turn > 1 ? 'fallback-attack' : ''}`}
          >
            <CharacterArt id={battle.player.id} />
          </div>
          <div
            key={`enemy-${battle.turn}`}
            className={`battle-character enemy ${battle.turn > 1 ? 'fallback-hit' : ''}`}
          >
            <CharacterArt id={battle.enemy.id} />
          </div>
          {status === 'failed' && (
            <span className="canvas-fallback">Упрощённая сцена</span>
          )}
        </>
      )}
    </>
  )
}
