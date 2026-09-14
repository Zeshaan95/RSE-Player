import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import type { Example } from '@/types'
import { zustandKvStorage } from '@/lib/zustandStorage'
import { STORAGE_KEYS } from '@/lib/storage'

interface UserContentState {
  userExamples: Example[]
  addExample: (lessonId: string, arabicSentence: string, translation: string) => void
  removeExample: (id: string) => void
}

export const useUserContentStore = create<UserContentState>()(
  persist(
    (set) => ({
      userExamples: [],

      addExample: (lessonId, arabicSentence, translation) => {
        const example: Example = {
          id: `user-ex:${Date.now()}`,
          lessonId,
          arabicSentence,
          translation,
          difficulty: 1,
          isUserAdded: true,
          createdAt: new Date().toISOString(),
        }
        set((s) => ({ userExamples: [...s.userExamples, example] }))
      },

      removeExample: (id) => set((s) => ({ userExamples: s.userExamples.filter((e) => e.id !== id) })),
    }),
    {
      name: STORAGE_KEYS.userExamples,
      storage: createJSONStorage(() => zustandKvStorage),
    },
  ),
)
