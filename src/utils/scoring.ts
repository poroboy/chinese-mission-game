export const SCORE = {
  correctFirstTry: 12,
  correctAfterRetry: 5,
  wrong: -6,
  pinyinHint: -2,
  translationHint: -5,
  lessonComplete: 30,
  highAccuracyBonus: 20,
} as const

const normalize = (value: string) => value.replace(/[\s，。！？,.!?]/g, '').toLowerCase()

export function validateLocalAnswer(answer: string, expectedAnswers: string[]) {
  const normalized = normalize(answer)
  if (!normalized) return { isCorrect: false, feedbackTh: 'ลองเลือกคำเพื่อสร้างประโยคก่อนนะ' }
  const exact = expectedAnswers.some((expected) => normalize(expected) === normalized)
  if (exact) return { isCorrect: true, feedbackTh: 'ประโยคถูกต้องและตอบเข้ากับสถานการณ์!' }

  const closest = expectedAnswers[0]
  const targetTokens = [...normalize(closest)]
  const overlap = targetTokens.filter((char) => normalized.includes(char)).length / Math.max(targetTokens.length, 1)
  return {
    isCorrect: false,
    feedbackTh: overlap > 0.65
      ? 'คำศัพท์เกือบครบแล้ว ลองสลับลำดับคำให้เป็นธรรมชาติกว่านี้'
      : 'ความหมายยังไม่ตรงกับคำถาม ลองดูเป้าหมายคำตอบอีกครั้ง',
  }
}
