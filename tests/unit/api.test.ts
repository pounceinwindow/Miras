import { describe, expect, it } from 'vitest'
import { getEntities, getEntity, upgradeEntity } from '../../src/api/entities'
import { getQuiz, startEncounter, submitQuiz } from '../../src/api/encounters'
import { startBattle, attack } from '../../src/api/battles'
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
    await expect(getQuiz('missing')).rejects.toThrow('Хранитель не найден')
  })
  for (const [token, answers] of [
    ['forest-01', [0, 1, 2]],
    ['tower-01', [1, 0, 2]],
    ['water-01', [1, 2, 0]],
    ['stone-01', [1, 0, 2]],
  ] as const) {
    it(`completes encounter ${token} and produces battle damage`, async () => {
      const entity = await startEncounter(token)
      const quiz = await getQuiz(entity.id)
      expect(quiz.questions).toHaveLength(3)
      const captured = await submitQuiz(
        entity.id,
        [...answers],
        getInitialProgress(),
      )
      expect(captured.outcome).toBe('captured')
      expect(captured.progress.collection).toHaveLength(1)
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
      await expect(
        submitQuiz(entity.id, [...answers], captured.progress),
      ).rejects.toThrow('Персонаж уже в коллекции')
    })
  }
  it('returns a failed quiz without adding to collection and reflects upgrades', async () => {
    const failed = await submitQuiz('shurale', [0, 0, 0], getInitialProgress())
    expect(failed.outcome).toBe('failed')
    expect(failed.progress.collection).toEqual([])
    const captured = await submitQuiz(
      'shurale',
      [0, 1, 2],
      getInitialProgress(),
    )
    const upgraded = await upgradeEntity('shurale', captured.progress)
    const entity = await getEntity('shurale', upgraded.progress)
    expect(entity).toMatchObject({
      level: 2,
      hp: 112,
      attack: 19,
    })
  })
})
