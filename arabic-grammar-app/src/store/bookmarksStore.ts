import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import type { Bookmark, ReviewItemType } from '@/types'
import { zustandKvStorage } from '@/lib/zustandStorage'
import { STORAGE_KEYS } from '@/lib/storage'

interface BookmarksState {
  bookmarks: Bookmark[]
  toggle: (itemType: ReviewItemType | 'example', refId: string, lessonId: string, note?: string) => void
  isBookmarked: (itemType: ReviewItemType | 'example', refId: string) => boolean
  remove: (id: string) => void
}

export const useBookmarksStore = create<BookmarksState>()(
  persist(
    (set, get) => ({
      bookmarks: [],

      toggle: (itemType, refId, lessonId, note) => {
        const existing = get().bookmarks.find((b) => b.itemType === itemType && b.refId === refId)
        if (existing) {
          set((s) => ({ bookmarks: s.bookmarks.filter((b) => b.id !== existing.id) }))
        } else {
          const bookmark: Bookmark = {
            id: `${itemType}:${refId}:${Date.now()}`,
            itemType,
            refId,
            lessonId,
            note,
            createdAt: new Date().toISOString(),
          }
          set((s) => ({ bookmarks: [...s.bookmarks, bookmark] }))
        }
      },

      isBookmarked: (itemType, refId) =>
        get().bookmarks.some((b) => b.itemType === itemType && b.refId === refId),

      remove: (id) => set((s) => ({ bookmarks: s.bookmarks.filter((b) => b.id !== id) })),
    }),
    {
      name: STORAGE_KEYS.bookmarks,
      storage: createJSONStorage(() => zustandKvStorage),
    },
  ),
)
