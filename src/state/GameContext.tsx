import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { onAuthStateChanged, signInWithPopup, signOut, type User } from 'firebase/auth'
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore'
import { auth, db, googleProvider, isFirebaseConfigured } from '../services/firebase'
import { lessons } from '../data/lessons'
import type { LessonProgress, UserProfile } from '../types'

type GameContextValue = {
  profile: UserProfile | null
  loading: boolean
  cloudMode: boolean
  login: () => Promise<void>
  logout: () => Promise<void>
  updateProfile: (changes: Partial<UserProfile>) => Promise<void>
  updateLessonProgress: (lessonId: string, changes: Partial<LessonProgress>) => Promise<void>
  resetProgress: () => Promise<void>
}

const GameContext = createContext<GameContextValue | null>(null)
const DEMO_KEY = 'chinese-mission-demo-profile-v1'

const initialLessonProgress = () => Object.fromEntries(
  lessons.map((lesson) => [lesson.id, {
    status: lesson.order === 1 ? 'active' : 'locked',
    score: 0,
    accuracy: 0,
    correctCount: 0,
    wrongCount: 0,
    hintCount: 0,
    translateCount: 0,
    targetVocabCoverage: 0,
  } satisfies LessonProgress]),
)

const makeProfile = (user?: User): UserProfile => ({
  uid: user?.uid ?? 'demo-user',
  displayName: user?.displayName ?? 'Chinese Explorer',
  email: user?.email ?? 'demo@local.dev',
  photoURL: user?.photoURL ?? undefined,
  totalScore: 1000,
  currentLevel: 1,
  streak: 1,
  currentLessonId: 'lesson-1',
  dailyGoal: 10,
  voiceEnabled: true,
  speechRate: 0.7,
  lessonProgress: initialLessonProgress(),
})

function loadDemoProfile() {
  const saved = sessionStorage.getItem(DEMO_KEY)
  if (!saved) return null
  try { return JSON.parse(saved) as UserProfile } catch { return null }
}

export function GameProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const profileRef = useRef<UserProfile | null>(null)
  const [loading, setLoading] = useState(isFirebaseConfigured)

  const setCurrentProfile = useCallback((next: UserProfile | null) => {
    profileRef.current = next
    setProfile(next)
  }, [])

  const loadCloudProfile = useCallback(async (user: User) => {
    if (!db) return
    const ref = doc(db, 'users', user.uid)
    const snapshot = await getDoc(ref)
    if (snapshot.exists()) {
      setCurrentProfile(snapshot.data() as UserProfile)
      return
    }
    const created = makeProfile(user)
    await setDoc(ref, { ...created, createdAt: serverTimestamp(), updatedAt: serverTimestamp() })
    setCurrentProfile(created)
  }, [setCurrentProfile])

  useEffect(() => {
    if (!isFirebaseConfigured || !auth) {
      setCurrentProfile(loadDemoProfile())
      setLoading(false)
      return
    }
    return onAuthStateChanged(auth, async (user) => {
      if (user) await loadCloudProfile(user)
      else setCurrentProfile(null)
      setLoading(false)
    })
  }, [loadCloudProfile, setCurrentProfile])

  const persist = useCallback(async (next: UserProfile) => {
    setCurrentProfile(next)
    if (isFirebaseConfigured && db) {
      await setDoc(doc(db, 'users', next.uid), { ...next, updatedAt: serverTimestamp() }, { merge: true })
    } else {
      sessionStorage.setItem(DEMO_KEY, JSON.stringify(next))
    }
  }, [setCurrentProfile])

  const login = async () => {
    if (isFirebaseConfigured && auth) await signInWithPopup(auth, googleProvider)
    else await persist(makeProfile())
  }

  const logout = async () => {
    if (isFirebaseConfigured && auth) await signOut(auth)
    else sessionStorage.removeItem(DEMO_KEY)
    setCurrentProfile(null)
  }

  const updateProfile = async (changes: Partial<UserProfile>) => {
    const current = profileRef.current
    if (!current) return
    await persist({ ...current, ...changes })
  }

  const updateLessonProgress = async (lessonId: string, changes: Partial<LessonProgress>) => {
    const current = profileRef.current
    if (!current) return
    const nextProgress = { ...current.lessonProgress, [lessonId]: { ...current.lessonProgress[lessonId], ...changes } }
    await persist({ ...current, lessonProgress: nextProgress })
  }

  const resetProgress = async () => {
    const current = profileRef.current
    if (!current) return
    const fresh = makeProfile()
    await persist({ ...fresh, uid: current.uid, displayName: current.displayName, email: current.email, photoURL: current.photoURL })
  }

  const value = useMemo(() => ({ profile, loading, cloudMode: isFirebaseConfigured, login, logout, updateProfile, updateLessonProgress, resetProgress }), [profile, loading])
  return <GameContext.Provider value={value}>{children}</GameContext.Provider>
}

export function useGame() {
  const context = useContext(GameContext)
  if (!context) throw new Error('useGame must be used inside GameProvider')
  return context
}
