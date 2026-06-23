import { describe, expect, it } from 'vitest'
import { getLesson } from './lessons'
import { lessons } from './lessons'

function canBuildAnswer(answer: string, tiles: string[]) {
  const normalized = answer.replace(/[\s！？，。,.!?]/g, '')
  const search = (remaining: string, available: string[]): boolean => {
    if (!remaining) return true
    return available.some((tile, index) => remaining.startsWith(tile)
      && search(remaining.slice(tile.length), available.filter((_, tileIndex) => tileIndex !== index)))
  }
  return search(normalized, tiles)
}

describe('lesson 1 vocabulary guardrail', () => {
  it('uses only taught vocabulary plus character names in the mission', () => {
    const lesson = getLesson('lesson-1')!
    const allowed = new Set([...lesson.vocab.map((word) => word.hanzi).join(''), ...'安娜小美'])
    const missionText = lesson.turns.flatMap((turn) => [
      turn.npc.hanzi,
      ...turn.expectedAnswers,
      ...turn.tiles.map((tile) => tile.hanzi),
    ]).join('').replace(/[\s！？，。,.!?]/g, '')

    expect([...missionText].filter((character) => !allowed.has(character))).toEqual([])
  })

  it('provides enough tiles to build at least one accepted answer in every turn', () => {
    const impossibleTurns = lessons.flatMap((lesson) => lesson.turns
      .filter((turn) => !turn.expectedAnswers.some((answer) => canBuildAnswer(answer, turn.tiles.map((tile) => tile.hanzi))))
      .map((turn) => `${lesson.id}/${turn.id}`))

    expect(impossibleTurns).toEqual([])
  })
})
