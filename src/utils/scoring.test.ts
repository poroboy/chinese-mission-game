import { describe, expect, it } from 'vitest'
import { validateLocalAnswer } from './scoring'

describe('validateLocalAnswer', () => {
  it('accepts an expected sentence with punctuation and spaces', () => {
    expect(validateLocalAnswer('我 叫 安娜。', ['我叫安娜']).isCorrect).toBe(true)
  })
  it('rejects incorrect word order', () => {
    expect(validateLocalAnswer('我安娜叫', ['我叫安娜']).isCorrect).toBe(false)
  })
  it('rejects an empty answer with useful feedback', () => {
    const result = validateLocalAnswer('', ['我是学生'])
    expect(result.isCorrect).toBe(false)
    expect(result.feedbackTh).toContain('เลือกคำ')
  })
})
