import { useEffect, useRef, useState } from 'react'
import { Application, Graphics } from 'pixi.js'
export default function BattleCanvas({ turn }: { turn: number }) {
  const host = useRef<HTMLDivElement>(null)
  const pulse = useRef(0)
  const [failed, setFailed] = useState(false)
  useEffect(() => {
    pulse.current = 1
  }, [turn])
  useEffect(() => {
    const element = host.current
    if (!element) return
    const app = new Application()
    let disposed = false,
      initialized = false
    const reduced = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches
    void (async () => {
      try {
        await app.init({
          resizeTo: element,
          backgroundAlpha: 0,
          antialias: true,
          resolution: Math.min(devicePixelRatio, 2),
          autoDensity: true,
        })
        initialized = true
        if (disposed) {
          app.destroy(true, { children: true })
          return
        }
        element.appendChild(app.canvas)
        app.canvas.setAttribute('aria-hidden', 'true')
        const graphics = new Graphics()
        app.stage.addChild(graphics)
        let elapsed = 0
        const draw = () => {
          const w = app.screen.width,
            h = app.screen.height
          graphics.clear()
          graphics
            .ellipse(w * 0.25, h * 0.75, w * 0.19, 22)
            .fill({ color: 0x9ab18a, alpha: 0.15 })
          graphics
            .ellipse(w * 0.75, h * 0.75, w * 0.19, 22)
            .fill({ color: 0x9ab18a, alpha: 0.15 })
          for (let i = 0; i < 22; i++) {
            const x = (i * 97 + Math.sin(elapsed + i) * 14) % w
            const y = h * 0.1 + ((i * 53 + elapsed * 8) % (h * 0.7))
            graphics
              .circle(x, y, 1.5 + (i % 3))
              .fill({ color: 0xe5ce83, alpha: 0.2 + (i % 3) * 0.13 })
          }
          if (!reduced && pulse.current > 0) {
            graphics
              .circle(w * 0.5, h * 0.45, 25 + (1 - pulse.current) * 100)
              .stroke({ color: 0xe5ce83, width: 2, alpha: pulse.current })
            pulse.current = Math.max(0, pulse.current - 0.025)
          }
        }
        draw()
        if (!reduced)
          app.ticker.add((t) => {
            elapsed += t.deltaTime * 0.015
            draw()
          })
      } catch {
        if (!disposed) setFailed(true)
        if (initialized) app.destroy(true, { children: true })
      }
    })()
    return () => {
      disposed = true
      if (initialized && app.renderer) app.destroy(true, { children: true })
    }
  }, [])
  return (
    <div className="battle-canvas" ref={host}>
      {failed && <span className="canvas-fallback">Упрощённая сцена</span>}
    </div>
  )
}
