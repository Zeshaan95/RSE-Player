import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import type { AnswerLogEntry, ConfidenceRating, MasteryStatus, ReviewItem, ReviewItemType } from '@/types'
import { createReviewItem, scheduleReview } from '@/lib/srs'
import { zustandKvStorage } from '@/lib/zustandStorage'
import { STORAGE_KEYS } from '@/lib/storage'
import { useProgressStore } from '@/store/progressStore'

interface ReviewState {
  items: Record<string, ReviewItem>
  answerLog: AnswerLogEntry[]

  /** Get (creating if necessary) the SRS record for a given study item. */
  ensureItem: (itemType: ReviewItemType, refId: string, lessonId: string, chapterId: string) => ReviewItem
  getItem: (itemType: ReviewItemType, refId: string) => ReviewItem | undefined
  /** Rate the item, reschedule it, and log the answer. Returns the updated item. */
  rate: (
    itemType: ReviewItemType,
    refId: string,
    lessonId: string,
    chapterId: string,
    confidence: ConfidenceRating,
    userAnswer?: string,
  ) => ReviewItem
  logFreeAnswer: (entry: Omit<AnswerLogEntry, 'id' | 'answeredAt'>) => void
  /** Explicit manual override of an item's mastery status, independent of the SRS rating flow. */
  setStatus: (itemType: ReviewItemType, refId: string, lessonId: string, chapterId: string, status: MasteryStatus) => void
  allItems: () => ReviewItem[]
}

function idFor(itemType: ReviewItemType, refId: string): string {
  return `${itemType}:${refId}`
}

export const useReviewStore = create<ReviewState>()(
  persist(
    (set, get) => ({
      items: {},
      answerLog: [],

      ensureItem: (itemType, refId, lessonId, chapterId) => {
        const id = idFor(itemType, refId)
        const existing = get().items[id]
        if (existing) return existing
        const created = createReviewItem(itemType, refId, lessonId, chapterId)
        set((s) => ({ items: { ...s.items, [id]: created } }))
        return created
      },

      getItem: (itemType, refId) => get().items[idFor(itemType, refId)],

      rate: (itemType, refId, lessonId, chapterId, confidence, userAnswer) => {
        const id = idFor(itemType, refId)
        const current = get().items[id] ?? createReviewItem(itemType, refId, lessonId, chapterId)
        const updated = scheduleReview(current, confidence)

        // A lapse on something previously learned - surface it as a
        // forgotten/difficult topic so review sessions prioritise it.
        if (confidence === 'again' && (current.status === 'review' || current.status === 'mastered')) {
          const progress = useProgressStore.getState()
          progress.addForgottenTopic(refId)
          progress.addDifficultTopic(refId)
        }
        if (updated.longestIntervalDays > current.longestIntervalDays) {
          useProgressStore.getState().noteRetentionInterval(updated.longestIntervalDays)
        }
        if (
          updated.status === 'mastered' &&
          current.status !== 'mastered' &&
          (itemType === 'recall' || itemType === 'explain')
        ) {
          useProgressStore.getState().markConceptMastered(refId)
        }

        set((s) => ({
          items: { ...s.items, [id]: updated },
          answerLog: [
            ...s.answerLog,
            {
              id: `${id}:${Date.now()}`,
              reviewItemId: id,
              itemType,
              refId,
              answeredAt: new Date().toISOString(),
              confidence,
              correct: confidence !== 'again',
              userAnswer,
            },
          ],
        }))
        return updated
      },

      logFreeAnswer: (entry) => {
        set((s) => ({
          answerLog: [
            ...s.answerLog,
            { ...entry, id: `${entry.itemType}:${entry.refId}:${Date.now()}`, answeredAt: new Date().toISOString() },
          ],
        }))
      },

      setStatus: (itemType, refId, lessonId, chapterId, status) => {
        const id = idFor(itemType, refId)
        const current = get().items[id] ?? createReviewItem(itemType, refId, lessonId, chapterId)
        set((s) => ({ items: { ...s.items, [id]: { ...current, status } } }))
      },

      allItems: () => Object.values(get().items),
    }),
    {
      name: STORAGE_KEYS.reviewItems,
      storage: createJSONStorage(() => zustandKvStorage),
    },
  ),
)
