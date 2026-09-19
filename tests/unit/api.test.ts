import { describe, expect, it } from 'vitest'
import { getEntities, getEntity, upgradeEntity } from '../../src/api/entities'
import {
  captureEncounter,
  imprisonEncounter,
  startEncounter,
} from '../../src/api/encounters'
import {
  startBattle,
  attack,
  recruitDefeatedEnemy,
} from '../../src/api/battles'
import { getInitialProgress } from '../../src/api/user'
import { getBattleFeedback } from '../../src/game/battle/feedback'

describe('frontend API contract', () => {
  it('returns isolated entity data and rejects missing IDs/tokens', async () => {
    const all = await getEntities()
    expect(all.map((e) => e.name)).toEqual([
      'Шурале',
      'Башня Сююмбике',
      'Су анасы',
      'Казанский Кремль',
    ])
    all[0].story[0] = 'mutated'
    expect((await getEntity('shurale')).story[0]).not.toBe('mutated')
    await expect(getEntity('missing')).rejects.toThrow('Хранитель не найден')
    await expect(startEncounter('missing')).rejects.toThrow('Метка не найдена')
  })
  for (const token of [
    'forest-01',
    'tower-01',
    'water-01',
    'stone-01',
  ] as const) {
    it(`completes encounter ${token} and produces battle damage`, async () => {
      const entity = await startEncounter(token)
      const captured = await captureEncounter(entity.id, getInitialProgress())
      expect(captured.outcome).toBe('captured')
      expect(
        captured.progress.collection.some((item) => item.id === entity.id),
      ).toBe(true)
      const started = await startBattle(entity.id, captured.progress)
      const before = started.progress.battle!
      const attacked = await attack(
        before.id,
        before.turn,
        'attack',
        started.progress,
      )
      const after = attacked.progress.battle!
      expect(after.enemy.hp).toBeLessThan(before.enemy.hp)
      expect(getBattleFeedback(before, after)?.enemyDamage).toBe(
        before.enemy.hp - after.enemy.hp,
      )
      expect(getBattleFeedback(after, after)).toBeNull()
      await expect(
        attack(before.id, before.turn, 'attack', attacked.progress),
      ).rejects.toThrow()
      const repeated = await captureEncounter(entity.id, captured.progress)
      expect(repeated.progress.collection).toHaveLength(
        entity.id === 'su-anasy' ? 1 : 2,
      )
    })
  }
  it('captures directly and reflects upgrades', async () => {
    const captured = await captureEncounter('shurale', getInitialProgress())
    const upgraded = await upgradeEntity('shurale', captured.progress)
    const entity = await getEntity('shurale', upgraded.progress)
    expect(entity).toMatchObject({
      level: 2,
      hp: 112,
      attack: 19,
    })
  })
  it('moves a defeated captive into the collection', async () => {
    const imprisoned = await imprisonEncounter('kereml', getInitialProgress())
    expect(imprisoned.progress.captives).toEqual(['kereml'])
    expect(
      imprisoned.progress.collection.some((item) => item.id === 'kereml'),
    ).toBe(false)

    const recruited = await recruitDefeatedEnemy('kereml', imprisoned.progress)
    expect(recruited.progress.captives).toEqual([])
    expect(
      recruited.progress.collection.some((item) => item.id === 'kereml'),
    ).toBe(true)
  })
})
