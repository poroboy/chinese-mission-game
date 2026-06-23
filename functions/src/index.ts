import { initializeApp } from 'firebase-admin/app'
import { getFirestore, FieldValue } from 'firebase-admin/firestore'
import { defineSecret } from 'firebase-functions/params'
import { HttpsError, onCall } from 'firebase-functions/v2/https'

initializeApp()

const geminiApiKey = defineSecret('GEMINI_API_KEY')
const region = 'asia-southeast1'
const model = 'gemini-2.0-flash-lite'

type TutorRequest = {
  mode: 'nextTurn' | 'validateAnswer'
  lessonId: string
  lessonTitle: string
  scenario: string
  currentVocab: string[]
  previousVocab: string[]
  turnNumber: number
  conversation: Array<{ speaker: 'ai' | 'user'; hanzi: string }>
  userAnswer?: string
  expectedMeaning?: string
}

const tutorSchema = {
  nextTurn: `{
    "npcMessage":{"hanzi":"string","pinyin":"string","meaningTh":"string","audioText":"string"},
    "expectedMeaning":"string",
    "targetVocabUsed":["string"],
    "answerTiles":[{"text":"string","pinyin":"string","meaningTh":"string"}],
    "lessonProgress":{"turnNumber":1,"shouldCompleteLesson":false,"coveragePercent":20}
  }`,
  validateAnswer: `{
    "isCorrect":true,
    "scoreDelta":12,
    "feedbackTh":"string",
    "correctedSentence":"string",
    "pinyin":"string",
    "meaningTh":"string"
  }`,
}

async function callGemini(payload: TutorRequest) {
  const contract = tutorSchema[payload.mode]
  const system = `คุณคือครูภาษาจีน HSK1 สำหรับผู้เรียนชาวไทย ทำหน้าที่ควบคุมเกมสนทนา
- ใช้คำศัพท์บทปัจจุบันเป็นหลักและคำจากบทก่อนหน้าได้
- ประโยคสั้น เป็นธรรมชาติ และไม่ใช้ไวยากรณ์เกินระดับ
- การตรวจคำตอบต้องรับประโยคอื่นที่สื่อความหมายและไวยากรณ์เข้าใจได้ ไม่ตรวจ exact match
- คำอธิบายใช้ภาษาไทยสั้นและให้กำลังใจ
- คืนค่า JSON ตาม contract เท่านั้น ห้าม markdown
JSON contract: ${contract}`
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiApiKey.value()}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: system }] },
      contents: [{ role: 'user', parts: [{ text: JSON.stringify(payload) }] }],
      generationConfig: { responseMimeType: 'application/json', temperature: 0.35 },
    }),
  })
  if (!response.ok) throw new HttpsError('internal', `AI provider error: ${response.status}`)
  const data = await response.json() as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> }
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text
  if (!text) throw new HttpsError('internal', 'AI returned an empty response')
  try { return JSON.parse(text) as unknown } catch { throw new HttpsError('internal', 'AI returned invalid JSON') }
}

function assertRequest(data: unknown): asserts data is TutorRequest {
  if (!data || typeof data !== 'object') throw new HttpsError('invalid-argument', 'Request body is required')
  const request = data as Partial<TutorRequest>
  if (!['nextTurn', 'validateAnswer'].includes(request.mode ?? '')) throw new HttpsError('invalid-argument', 'Invalid mode')
  if (!request.lessonId || !request.lessonTitle || !Array.isArray(request.currentVocab)) throw new HttpsError('invalid-argument', 'Lesson context is incomplete')
  if ((request.conversation?.length ?? 0) > 30) throw new HttpsError('invalid-argument', 'Conversation is too long')
}

export const aiTutor = onCall({ region, secrets: [geminiApiKey], enforceAppCheck: false, timeoutSeconds: 30, memory: '256MiB' }, async (request) => {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Sign in before starting a mission')
  assertRequest(request.data)
  const result = await callGemini(request.data)
  await getFirestore().collection('aiUsage').doc(request.auth.uid).set({
    lastUsedAt: FieldValue.serverTimestamp(),
    calls: FieldValue.increment(1),
  }, { merge: true })
  return result
})
