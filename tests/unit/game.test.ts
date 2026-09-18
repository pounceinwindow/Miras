import { describe, expect, it } from 'vitest'
import { COOLDOWN_MS } from '../../shared/characters'
import { executeDemo } from '../../shared/demo'
import { cast, createPve, move, rules, stepPve } from '../../shared/pve/engine'
import { initialProgress } from '../../shared/types'

const now = Date.UTC(2026, 8, 18, 12)
const correctQuiz = {
  type: 'capture' as const,
  characterId: 'shurale' as const,
  tagId: 'forest-01',
  answers: [0, 1, 2],
}

describe('onboarding and encounter gate', () => {
  it('starts with Su anasy and opens a challenge after the quiz', () => {
    const input = initialProgress()
    expect(input.collection.map((item) => item.id)).toEqual(['su-anasy'])
    const result = executeDemo(input, correctQuiz, now)
    expect(result.outcome).toBe('ready')
    expect(result.progress.challenges).toEqual(['shurale'])
    expect(result.progress.collection.map((item) => item.id)).toEqual([
      'su-anasy',
    ])
    expect(input.challenges).toEqual([])
  })

  it('requires the NFC tag and applies the quiz cooldown for 24 hours', () => {
    expect(() =>
      executeDemo(initialProgress(), { ...correctQuiz, tagId: 'wrong' }, now),
    ).toThrow('Неверная метка')
    const failed = executeDemo(
      initialProgress(),
      { ...correctQuiz, answers: [1, 1, 1] },
      now,
    ).progress
    expect(Date.parse(failed.cooldowns.shurale!)).toBe(now + COOLDOWN_MS)
    expect(() =>
      executeDemo(failed, correctQuiz, now + COOLDOWN_MS - 1),
    ).toThrow('через сутки')
    expect(executeDemo(failed, correctQuiz, now + COOLDOWN_MS).outcome).toBe(
      'ready',
    )
  })

  it('does not allow an encounter battle before the quiz', () => {
    expect(() =>
      executeDemo(initialProgress(), {
        type: 'pveStart',
        characterId: 'su-anasy',
        target: 'shurale',
        mode: 'encounter',
      }),
    ).toThrow('ответь на вопросы')
  })
})

describe('real-time lane combat', () => {
  it('telegraphs attacks and lets the player dodge by changing lane', () => {
    const battle = createPve('battle', 'su-anasy', 1, 'shurale', 'training')
    battle.paused = false
    battle.player.lane = 1
    battle.enemy.lane = 1
    stepPve(battle, 25)
    expect(battle.threats.some((item) => item.owner === 'enemy')).toBe(true)
    expect(move(battle, 'player', 0)).toBe(true)
    const hp = battle.player.hp
    stepPve(battle, 12)
    expect(battle.player.hp).toBe(hp)
  })

  it('comb roots movement but wave remains usable and cleanses it', () => {
    const battle = createPve('battle', 'su-anasy', 1, 'shurale', 'training')
    battle.paused = false
    battle.player.rootUntil = 50
    expect(move(battle, 'player', 0)).toBe(false)
    expect(cast(battle, 'player', 0)).toBe(true)
    expect(battle.player.rootUntil).toBe(0)
    expect(move(battle, 'player', 0)).toBe(true)
  })

  it('reflects projectiles but not ground skills', () => {
    const projectile = createPve('one', 'su-anasy', 1, 'shurale', 'training')
    projectile.paused = false
    projectile.player.reflectUntil = 100
    projectile.player.lane = projectile.enemy.lane = 1
    projectile.nextPlayerAttack = 999
    projectile.nextEnemyAttack = 1
    const enemyHp = projectile.enemy.hp
    stepPve(projectile, 13)
    expect(projectile.player.hp).toBe(projectile.player.maxHp)
    expect(projectile.enemy.hp).toBeLessThan(enemyHp)

    const ground = createPve('two', 'su-anasy', 1, 'kereml', 'training')
    ground.paused = false
    ground.player.reflectUntil = 100
    ground.enemy.skillReady[1] = 0
    expect(cast(ground, 'enemy', 1)).toBe(true)
    stepPve(ground, rules.skills.seal.windup)
    expect(ground.player.hp).toBeLessThan(ground.player.maxHp)
  })

  it('freezes after a disconnect and pays/captures exactly once', () => {
    let progress = executeDemo(initialProgress(), correctQuiz, now).progress
    progress = executeDemo(
      progress,
      {
        type: 'pveStart',
        characterId: 'su-anasy',
        target: 'shurale',
        mode: 'encounter',
      },
      now,
      'battle-id',
    ).progress
    progress.pve!.paused = false
    progress.pve!.enemy.hp = 1
    progress.pve!.enemy.lane = progress.pve!.player.lane
    progress.pve!.nextPlayerAttack = 1
    progress = executeDemo(
      progress,
      { type: 'pve', battleId: 'battle-id', action: 'poll' },
      now + 100,
    ).progress
    progress = executeDemo(
      progress,
      { type: 'pve', battleId: 'battle-id', action: 'poll' },
      now + 1400,
    ).progress
    expect(progress.pve!.status).toBe('won')
    expect(progress.balance).toBe(rules.reward)
    expect(progress.collection.some((item) => item.id === 'shurale')).toBe(true)
    const replay = executeDemo(
      progress,
      { type: 'pve', battleId: 'battle-id', action: 'poll' },
      now + 1500,
    ).progress
    expect(replay.balance).toBe(rules.reward)
    expect(replay.wins).toBe(1)
  })
})
