import { describe, it, expect } from 'vitest'
import { initialProgress } from '../../shared/types'
import { executeDemo } from '../../shared/demo'
import { createBattle, takeTurn, enemyIntent } from '../../shared/battle'
import { characters } from '../../shared/characters'
const now = Date.UTC(2026, 8, 18, 12)
const capture = () =>
  executeDemo(
    initialProgress(),
    { type: 'capture', characterId: 'shurale' },
    now,
  ).progress
describe('capture and economy', () => {
  it('captures at level one and does not mutate input', () => {
    const input = initialProgress()
    const { progress, outcome } = executeDemo(
      input,
      { type: 'capture', characterId: 'shurale' },
      now,
    )
    expect(outcome).toBe('captured')
    expect(progress.collection[0].level).toBe(1)
    expect(input.collection).toEqual([])
  })
  it('treats a repeated scan as an idempotent capture', () => {
    const first = capture()
    const second = executeDemo(first, {
      type: 'capture',
      characterId: 'shurale',
    })
    expect(second.outcome).toBe('captured')
    expect(second.progress.collection).toHaveLength(1)
  })
  it('charges upgrades and enforces limits', () => {
    const p = capture()
    const result = executeDemo(p, {
      type: 'upgrade',
      characterId: 'shurale',
    }).progress
    expect(result.collection[0].level).toBe(2)
    p.collection[0].level = 10
    expect(() =>
      executeDemo(p, { type: 'upgrade', characterId: 'shurale' }),
    ).toThrow()
  })
  it('rejects unowned fighters', () => {
    expect(() =>
      executeDemo(initialProgress(), {
        type: 'startBattle',
        characterId: 'shurale',
      }),
    ).toThrow()
  })
})
describe('battle', () => {
  it('rejects skill without energy and protects input', () => {
    const p = createBattle('x', 'shurale', 1)
    expect(() => takeTurn(p, 'skill')).toThrow()
    const result = takeTurn(p, 'attack')
    expect(p.turn).toBe(1)
    expect(result.turn).toBe(2)
    expect(result.player.energy).toBe(3)
  })
  it('guard reduces incoming damage', () => {
    const p = createBattle('x', 'shurale', 1)
    expect(takeTurn(p, 'guard').player.hp).toBeGreaterThan(
      takeTurn(p, 'attack').player.hp,
    )
  })
  for (const c of characters)
    it(`${c.id} can win with a telegraphed strategy`, () => {
      let battle = createBattle('x', c.id, 1)
      while (battle.status === 'active') {
        const action =
          enemyIntent(battle.turn) === 'skill'
            ? 'guard'
            : enemyIntent(battle.turn) !== 'guard' && battle.player.energy >= 3
              ? 'skill'
              : 'attack'
        battle = takeTurn(battle, action)
      }
      expect(battle.status).toBe('won')
    })
  it('rewards exactly once, rejects a replay and survives serialization', () => {
    let p = executeDemo(
      capture(),
      { type: 'startBattle', characterId: 'shurale' },
      now,
      'battle-id',
    ).progress
    const original = p.battle!
    while (p.battle!.status === 'active') {
      const b = p.battle!
      p = executeDemo(p, {
        type: 'battleTurn',
        battleId: b.id,
        turn: b.turn,
        action:
          enemyIntent(b.turn) === 'skill'
            ? 'guard'
            : enemyIntent(b.turn) !== 'guard' && b.player.energy >= 3
              ? 'skill'
              : 'attack',
      }).progress
    }
    expect(p.wins).toBe(1)
    expect(() =>
      executeDemo(p, {
        type: 'battleTurn',
        battleId: original.id,
        turn: original.turn,
        action: 'attack',
      }),
    ).toThrow()
    expect(JSON.parse(JSON.stringify(p))).toEqual(p)
  })
  it('terminates repeated guarding', () => {
    let b = createBattle('x', 'kereml', 10)
    while (b.status === 'active') b = takeTurn(b, 'guard')
    expect(b.status).toBe('lost')
    expect(b.turn).toBeLessThanOrEqual(41)
  })
})
