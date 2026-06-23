export type VocabWord = {
  id: string
  hanzi: string
  pinyin: string
  meaningTh: string
  meaningEn?: string
  example: string
  examplePinyin: string
  exampleMeaningTh: string
}

export type AnswerTile = Pick<VocabWord, 'hanzi' | 'pinyin' | 'meaningTh'> & { id: string }

export type MissionTurn = {
  id: string
  npc: { hanzi: string; pinyin: string; meaningTh: string }
  expectedAnswers: string[]
  answerMeaning: string
  tiles: AnswerTile[]
  vocabUsed: string[]
}

export type Lesson = {
  id: string
  order: number
  title: string
  subtitle: string
  scenario: string
  grammar: string[]
  accent: string
  vocab: VocabWord[]
  turns: MissionTurn[]
}

export type LessonProgress = {
  status: 'locked' | 'active' | 'completed'
  score: number
  accuracy: number
  correctCount: number
  wrongCount: number
  hintCount: number
  translateCount: number
  targetVocabCoverage: number
}

export type UserProfile = {
  uid: string
  displayName: string
  email: string
  photoURL?: string
  totalScore: number
  currentLevel: number
  streak: number
  currentLessonId: string
  dailyGoal: number
  voiceEnabled: boolean
  lessonProgress: Record<string, LessonProgress>
}
