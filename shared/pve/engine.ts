import rules from './rules.json'
import type { CharacterId } from '../types'
export { rules }
export type SkillId = keyof typeof rules.skills
export type Lane = 0 | 1 | 2
export type Side = 'player' | 'enemy'
export interface Combatant {
  id: CharacterId
  level: number
  hp: number
  maxHp: number
  lane: Lane
  rootUntil: number
  reflectUntil: number
  mistUntil: number
  weakUntil: number
  shield: number
  shieldUntil: number
  moveReady: number
  skillReady: number[]
}
export interface Threat {
  id: number
  owner: Side
  kind: SkillId | 'shot'
  lanes: number[]
  due: number
  damage: number
  duration: number
}
export interface PveBattle {
  id: string
  mode: 'training' | 'encounter'
  target: CharacterId
  player: Combatant
  enemy: Combatant
  tick: number
  status: 'active' | 'won' | 'lost'
  paused: boolean
  threats: Threat[]
  seals: { side: Side; lane: number; until: number }[]
  seq: number
  nextPlayerAttack: number
  nextEnemyAttack: number
  nextEnemyMove: number
  nextEnemySkill: number
  enemySkill: number
  log: string[]
}
export type PveInput =
  { kind: 'move'; lane: Lane } | { kind: 'skill'; slot: 0 | 1 }
export function fighter(id: CharacterId, level: number): Combatant {
  const hp = rules.characters[id].hp + (level - 1) * 12
  return {
    id,
    level,
    hp,
    maxHp: hp,
    lane: 1,
    rootUntil: 0,
    reflectUntil: 0,
    mistUntil: 0,
    weakUntil: 0,
    shield: 0,
    shieldUntil: 0,
    moveReady: 0,
    skillReady: [0, 0],
  }
}
export function createPve(
  id: string,
  hero: CharacterId,
  level: number,
  target: CharacterId,
  mode: PveBattle['mode'],
): PveBattle {
  const enemy = fighter(target, mode === 'training' ? level : 1)
  enemy.hp = enemy.maxHp = Math.round(enemy.hp * 1.1)
  return {
    id,
    mode,
    target,
    player: fighter(hero, level),
    enemy,
    tick: 0,
    status: 'active',
    paused: true,
    threats: [],
    seals: [],
    seq: 0,
    nextPlayerAttack: 10,
    nextEnemyAttack: 25,
    nextEnemyMove: 50,
    nextEnemySkill: 40,
    enemySkill: 0,
    log: [
      'Следи за отмеченными позициями. Обычная атака срабатывает на одной дорожке с врагом.',
    ],
  }
}
function note(b: PveBattle, text: string) {
  b.log = [text, ...b.log].slice(0, 5)
}
function other(side: Side): Side {
  return side === 'player' ? 'enemy' : 'player'
}
function hit(b: PveBattle, side: Side, amount: number) {
  const f = b[side],
    absorbed = Math.min(f.shield, amount)
  f.shield -= absorbed
  f.hp = Math.max(0, f.hp - amount + absorbed)
}
function threat(
  b: PveBattle,
  owner: Side,
  kind: Threat['kind'],
  lanes: number[],
  damage: number,
  windup: number,
  duration = 0,
) {
  b.threats.push({
    id: ++b.seq,
    owner,
    kind,
    lanes,
    damage,
    due: b.tick + windup,
    duration,
  })
}
export function move(b: PveBattle, side: Side, lane: Lane): boolean {
  const f = b[side]
  if (
    b.status !== 'active' ||
    b.paused ||
    ![0, 1, 2].includes(lane) ||
    lane === f.lane ||
    f.rootUntil > b.tick ||
    f.moveReady > b.tick ||
    b.seals.some((s) => s.side === side && s.lane === lane && s.until > b.tick)
  )
    return false
  f.lane = lane
  f.moveReady = b.tick + 4
  return true
}
export function cast(b: PveBattle, side: Side, slot: 0 | 1): boolean {
  const f = b[side],
    target = b[other(side)]
  if (
    b.status !== 'active' ||
    b.paused ||
    ![0, 1].includes(slot) ||
    f.skillReady[slot] > b.tick
  )
    return false
  const skill = rules.characters[f.id].skills[slot] as SkillId,
    r = rules.skills[skill]
  f.skillReady[slot] = b.tick + r.cooldown
  const damage = r.damage + (f.level - 1) * 2
  if (skill === 'wave') {
    f.rootUntil = 0
    f.reflectUntil = b.tick + r.duration
    threat(b, side, skill, [f.lane], damage, r.windup)
  } else if (skill === 'mist') f.mistUntil = b.tick + r.duration
  else if (skill === 'will' || skill === 'wall') {
    f.shield = damage
    f.shieldUntil = b.tick + r.duration
    f.rootUntil = skill === 'wall' ? b.tick + 20 : 0
  } else
    threat(
      b,
      side,
      skill,
      skill === 'voice' ? [target.lane, (target.lane + 1) % 3] : [target.lane],
      damage,
      r.windup,
      r.duration,
    )
  note(b, `${side === 'player' ? 'Ты' : 'Соперник'}: ${r.name}`)
  return true
}
export function inputPve(b: PveBattle, input: PveInput) {
  return input.kind === 'move'
    ? move(b, 'player', input.lane)
    : cast(b, 'player', input.slot)
}
export function stepPve(b: PveBattle, ticks = 1): PveBattle {
  for (let i = 0; i < ticks && b.status === 'active' && !b.paused; i++) {
    b.tick++
    b.seals = b.seals.filter((s) => s.until > b.tick)
    for (const side of ['player', 'enemy'] as const)
      if (b[side].shieldUntil <= b.tick) b[side].shield = 0
    // Resolve all simultaneous hits before checking the result. A tie is a loss.
    const due = b.threats.filter((t) => t.due <= b.tick)
    b.threats = b.threats.filter((t) => t.due > b.tick)
    for (const t of due) {
      const side = other(t.owner),
        target = b[side]
      if (t.kind === 'seal')
        for (const lane of t.lanes)
          b.seals.push({ side, lane, until: b.tick + t.duration })
      if (!t.lanes.includes(target.lane)) continue
      if (t.kind === 'shot' && target.reflectUntil > b.tick) {
        hit(b, t.owner, t.damage)
        note(b, 'Снаряд отражён!')
        continue
      }
      if (t.kind === 'shot' && target.mistUntil > b.tick) continue
      hit(b, side, t.damage)
      if (t.kind === 'comb' || t.kind === 'tickle')
        target.rootUntil = Math.max(target.rootUntil, b.tick + t.duration)
      if (t.kind === 'voice') target.weakUntil = b.tick + t.duration
    }
    if (b.player.hp <= 0 || b.tick >= rules.maxTicks) b.status = 'lost'
    else if (b.enemy.hp <= 0) b.status = 'won'
    if (b.status !== 'active') {
      b.threats = []
      note(
        b,
        b.status === 'won'
          ? 'Победа!'
          : b.tick >= rules.maxTicks
            ? 'Время вышло. Попробуй другую тактику.'
            : 'Поражение. Можно сразу повторить.',
      )
      break
    }
    if (b.tick >= b.nextEnemyMove) {
      // Different opponents use different deterministic movement patterns.
      const lane = ((b.enemy.lane + (b.enemy.id === 'shurale' ? 2 : 1)) %
        3) as Lane
      move(b, 'enemy', lane)
      b.nextEnemyMove = b.tick + 50
    }
    if (b.tick >= b.nextEnemySkill) {
      cast(b, 'enemy', b.enemySkill as 0 | 1)
      b.enemySkill = 1 - b.enemySkill
      b.nextEnemySkill = b.tick + 45
    }
    for (const side of ['player', 'enemy'] as const) {
      const key = side === 'player' ? 'nextPlayerAttack' : 'nextEnemyAttack'
      if (b.tick < b[key]) continue
      const f = b[side],
        target = b[other(side)]
      if (side === 'enemy' || f.lane === target.lane) {
        const baseDamage = rules.characters[f.id].attack + (f.level - 1) * 2
        const damage =
          side === 'enemy' ? Math.ceil(baseDamage * 0.7) : baseDamage
        threat(
          b,
          side,
          'shot',
          [side === 'player' ? f.lane : target.lane],
          f.weakUntil > b.tick ? Math.ceil(damage / 2) : damage,
          12,
        )
      }
      b[key] = b.tick + 20
    }
  }
  return b
}
export function statuses(f: Combatant, tick: number): string[] {
  return [
    f.rootUntil > tick
      ? `Удержание ${((f.rootUntil - tick) / 10).toFixed(1)} с`
      : '',
    f.reflectUntil > tick ? 'Отражение' : '',
    f.mistUntil > tick ? 'Морок' : '',
    f.weakUntil > tick ? 'Атака ослаблена' : '',
    f.shield > 0 ? `Щит ${f.shield}` : '',
  ].filter(Boolean)
}
