import { Application, Assets, Graphics, Sprite, Text } from 'pixi.js'
import type { Battle } from '../api/types'
import { getBattleFeedback, type BattleFeedback } from '../game/battle/feedback'

/** Owns the canvas, sprites and ticker; React owns controls and accessible HP. */
export class BattleScene {
  private app = new Application()
  private disposed = false
  private initialized = false
  private player?: Sprite
  private enemy?: Sprite
  private feedback: BattleFeedback | null = null
  private startedAt = 0
  private reduced = window.matchMedia('(prefers-reduced-motion: reduce)')
    .matches
  constructor(private battle: Battle) {}

  async mount(host: HTMLElement, playerImage: string, enemyImage: string) {
    await this.app.init({
      resizeTo: host,
      backgroundAlpha: 0,
      antialias: true,
      resolution: Math.min(devicePixelRatio, 2),
      autoDensity: true,
    })
    this.initialized = true
    if (this.disposed) {
      this.destroy()
      return
    }
    const [playerTexture, enemyTexture] = await Promise.all([
      Assets.load(playerImage),
      Assets.load(enemyImage),
    ])
    if (this.disposed) return
    this.player = new Sprite(playerTexture)
    this.enemy = new Sprite(enemyTexture)
    this.player.anchor.set(0.5)
    this.enemy.anchor.set(0.5)
    const background = new Graphics()
    const playerHit = new Text({
      text: '',
      style: {
        fontFamily: 'system-ui',
        fontSize: 28,
        fontWeight: 'bold',
        fill: '#ffd89a',
      },
    })
    const enemyHit = new Text({
      text: '',
      style: {
        fontFamily: 'system-ui',
        fontSize: 28,
        fontWeight: 'bold',
        fill: '#ffe6b0',
      },
    })
    playerHit.anchor.set(0.5)
    enemyHit.anchor.set(0.5)
    this.app.stage.addChild(
      background,
      this.player,
      this.enemy,
      playerHit,
      enemyHit,
    )
    host.appendChild(this.app.canvas)
    this.app.canvas.setAttribute('aria-hidden', 'true')
    let elapsed = 0
    this.app.ticker.add((ticker) => {
      if (!this.player || !this.enemy) return
      if (!this.reduced) elapsed += ticker.deltaMS / 1000
      const w = this.app.screen.width,
        h = this.app.screen.height
      background.clear()
      for (const x of [0.25, 0.75])
        background
          .ellipse(w * x, h * 0.87, w * 0.19, 14)
          .fill({ color: 0x9ab18a, alpha: 0.15 })
      for (let i = 0; i < 22; i++)
        background
          .circle(
            (i * 97 + Math.sin(elapsed + i) * 14 + w) % w,
            h * 0.08 + ((i * 53 + elapsed * 8) % (h * 0.72)),
            1.5 + (i % 3),
          )
          .fill({ color: 0xe5ce83, alpha: 0.2 + (i % 3) * 0.13 })
      const scale = Math.min((w * 0.44) / 240, (h * 0.85) / 250)
      const age = (performance.now() - this.startedAt) / 1000
      const feedback = age < 1.15 ? this.feedback : null
      const lunge = (start: number) =>
        this.reduced
          ? 0
          : Math.sin(Math.min(1, Math.max(0, (age - start) / 0.3)) * Math.PI) *
            Math.min(40, w * 0.09)
      const hit = (start: number) =>
        !this.reduced && age > start && age < start + 0.23
      this.player.scale.set(scale)
      this.enemy.scale.set(-scale, scale)
      this.player.position.set(
        w * 0.25 + (feedback?.enemyDamage ? lunge(0) : 0),
        h * 0.48,
      )
      this.enemy.position.set(
        w * 0.75 - (feedback?.playerDamage ? lunge(0.48) : 0),
        h * 0.48,
      )
      this.player.tint =
        feedback?.playerDamage && hit(0.63) ? 0xff7a6b : 0xffffff
      this.enemy.tint = feedback?.enemyDamage && hit(0.15) ? 0xff7a6b : 0xffffff
      this.player.alpha = this.battle.player.hp === 0 ? 0.4 : 1
      this.enemy.alpha = this.battle.enemy.hp === 0 ? 0.4 : 1
      for (const [label, damage, x, start] of [
        [enemyHit, feedback?.enemyDamage, w * 0.75, 0.15],
        [playerHit, feedback?.playerDamage, w * 0.25, 0.63],
      ] as const) {
        label.visible = !!damage && age >= start
        label.text = damage ? `−${damage}` : ''
        label.position.set(
          x,
          h * 0.24 - (this.reduced ? 0 : Math.max(0, age - start) * 35),
        )
        label.alpha = this.reduced ? 1 : Math.min(1, (1.15 - age) * 4)
      }
    })
  }

  update(battle: Battle) {
    const feedback = getBattleFeedback(this.battle, battle)
    this.battle = battle
    if (feedback) {
      this.feedback = feedback
      this.startedAt = performance.now()
    }
  }

  destroy() {
    this.disposed = true
    if (this.initialized) {
      this.initialized = false
      this.app.destroy(true, { children: true })
    }
  }
}
