import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import type { StudySessionRecord, StudySessionStep } from '@/types'
import { zustandKvStorage } from '@/lib/zustandStorage'
import { STORAGE_KEYS } from '@/lib/storage'

interface SessionState {
  history: StudySessionRecord[]
  active: StudySessionRecord | null

  startSession: () => void
  completeStep: (step: StudySessionStep) => void
  recordItemResult: (correct: boolean) => void
  finishSession: (reflectionNote?: string) => void
  abandonSession: () => void
}

export const useSessionStore = create<SessionState>()(
  persist(
    (set, get) => ({
      history: [],
      active: null,

      startSession: () => {
        const active: StudySessionRecord = {
          id: `session:${Date.now()}`,
          date: new Date().toISOString(),
          startedAt: new Date().toISOString(),
          stepsCompleted: [],
          durationMinutes: 0,
          itemsReviewed: 0,
          itemsCorrect: 0,
        }
        set({ active })
      },

      completeStep: (step) => {
        const active = get().active
        if (!active) return
        if (active.stepsCompleted.includes(step)) return
        set({ active: { ...active, stepsCompleted: [...active.stepsCompleted, step] } })
      },

      recordItemResult: (correct) => {
        const active = get().active
        if (!active) return
        set({
          active: {
            ...active,
            itemsReviewed: active.itemsReviewed + 1,
            itemsCorrect: active.itemsCorrect + (correct ? 1 : 0),
          },
        })
      },

      finishSession: (reflectionNote) => {
        const active = get().active
        if (!active) return
        const completedAt = new Date().toISOString()
        const durationMinutes = Math.max(
          1,
          Math.round((new Date(completedAt).getTime() - new Date(active.startedAt).getTime()) / 60000),
        )
        const finished: StudySessionRecord = { ...active, completedAt, durationMinutes, reflectionNote }
        set((s) => ({ history: [...s.history, finished], active: null }))
      },

      abandonSession: () => set({ active: null }),
    }),
    {
      name: STORAGE_KEYS.sessions,
      storage: createJSONStorage(() => zustandKvStorage),
    },
  ),
)
