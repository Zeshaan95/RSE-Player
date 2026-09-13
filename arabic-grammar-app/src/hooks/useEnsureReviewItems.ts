import { useEffect } from 'react'
import { lessons } from '@/lib/content'
import { useReviewStore } from '@/store/reviewStore'

/**
 * Registers an SRS record for every study item in the curriculum the first
 * time the app runs, so "due today" / "new items" counts are meaningful
 * from the very first visit rather than only after a student happens to
 * open each lesson. Cheap and idempotent - ensureItem no-ops for items
 * that already exist.
 */
export function useEnsureReviewItems() {
  const ensureItem = useReviewStore((s) => s.ensureItem)

  useEffect(() => {
    for (const lesson of lessons) {
      if (lesson.isPlaceholder) continue
      for (const section of lesson.memorisationSections) {
        ensureItem('memorisation', section.id, lesson.id, lesson.chapterId)
      }
      for (const question of lesson.recallQuestions) {
        ensureItem('recall', question.id, lesson.id, lesson.chapterId)
      }
      for (const exercise of lesson.irabExercises) {
        ensureItem('irab', exercise.id, lesson.id, lesson.chapterId)
      }
      ensureItem('explain', lesson.id, lesson.id, lesson.chapterId)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
}
