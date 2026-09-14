import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { zustandKvStorage } from '@/lib/zustandStorage'
import { STORAGE_KEYS } from '@/lib/storage'

export interface ReviewSessionSizes {
  memorisation: number
  grammar: number
  irab: number
}

interface SettingsState {
  theme: 'light' | 'dark' | 'system'
  reviewSessionSizes: ReviewSessionSizes
  setTheme: (theme: 'light' | 'dark' | 'system') => void
  setReviewSessionSizes: (sizes: ReviewSessionSizes) => void
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      theme: 'system',
      reviewSessionSizes: { memorisation: 5, grammar: 5, irab: 5 },
      setTheme: (theme) => set({ theme }),
      setReviewSessionSizes: (sizes) => set({ reviewSessionSizes: sizes }),
    }),
    {
      name: STORAGE_KEYS.settings,
      storage: createJSONStorage(() => zustandKvStorage),
    },
  ),
)
