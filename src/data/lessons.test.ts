import { describe, expect, it } from 'vitest'
import { getLesson } from './lessons'

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
})
