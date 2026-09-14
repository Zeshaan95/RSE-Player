import { useBookmarksStore } from '@/store/bookmarksStore'
import type { ReviewItemType } from '@/types'

export function BookmarkButton({
  itemType,
  refId,
  lessonId,
}: {
  itemType: ReviewItemType | 'example'
  refId: string
  lessonId: string
}) {
  const isBookmarked = useBookmarksStore((s) => s.isBookmarked(itemType, refId))
  const toggle = useBookmarksStore((s) => s.toggle)

  return (
    <button
      type="button"
      onClick={() => toggle(itemType, refId, lessonId)}
      aria-pressed={isBookmarked}
      title={isBookmarked ? 'Remove from difficult topics' : 'Mark as a difficult topic'}
      className={`rounded-md border px-2 py-1 text-xs font-medium transition-colors ${
        isBookmarked
          ? 'border-amber-500 bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300'
          : 'border-[var(--color-border)] text-[var(--color-ink-soft)] hover:border-amber-400'
      }`}
    >
      {isBookmarked ? '★ Bookmarked' : '☆ Bookmark'}
    </button>
  )
}
