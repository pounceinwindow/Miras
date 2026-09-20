import { characters } from '../../shared/characters'
import type { Entity } from '../api/types'
// Reuse the existing content and stable IDs to preserve saved collections.
export const entities: Entity[] = characters.map((character) => ({
  id: character.id,
  tatar: character.tatar,
  element: character.element,
  color: character.color,
  location: character.location,
  tag: character.tag,
  description: character.description,
  story: character.story,
  source: character.source,
  name:
    character.id === 'syuyumbike'
      ? 'Башня Сююмбике'
      : character.id === 'kereml'
        ? 'Казанский Кремль'
        : character.name,
  title:
    character.id === 'syuyumbike'
      ? 'Хранительница башни'
      : character.id === 'kereml'
        ? 'Керемль — хранитель Кремля'
        : character.title,
  kind: ['syuyumbike', 'kereml'].includes(character.id)
    ? 'Достопримечательность'
    : character.kind,
  imageUrl: `/entities/${character.id}.svg`,
  level: 1,
  hp: character.health,
  attack: character.attack,
  // Defense is the percentage blocked by the guard action in the MVP engine.
  defense: 70,
  ability: {
    name: character.skill,
    description:
      'Наносит двойной урон. Требует 3 энергии. Обычная атака и защита восстанавливают 1 энергию.',
  },
  nextUpgradeCost: 30,
  quiz: character.quiz,
  voice: character.voice,
}))
