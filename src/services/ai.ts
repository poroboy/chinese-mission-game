import { httpsCallable } from 'firebase/functions'
import { functions } from './firebase'

export type TutorPayload = {
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

export async function callTutor<T>(payload: TutorPayload): Promise<T> {
  if (!functions) throw new Error('Firebase is not configured')
  const callable = httpsCallable<TutorPayload, T>(functions, 'aiTutor')
  const response = await callable(payload)
  return response.data
}
