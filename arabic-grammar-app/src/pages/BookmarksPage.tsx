import { Link } from 'react-router-dom'
import { Card } from '@/components/Card'
import { useBookmarksStore } from '@/store/bookmarksStore'
import { useProgressStore } from '@/store/progressStore'
import { resolveRefLabel } from '@/lib/content'

export function BookmarksPage() {
  const bookmarks = useBookmarksStore((s) => s.bookmarks)
  const removeBookmark = useBookmarksStore((s) => s.remove)
  const difficultTopics = useProgressStore((s) => s.difficultTopics)
  const removeDifficultTopic = useProgressStore((s) => s.removeDifficultTopic)

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">My Difficult Topics</h1>
        <p className="text-sm text-[var(--color-ink-soft)]">
          Everything you've bookmarked, plus items the system noticed you're forgetting. These are prioritised in
          Today's Review.
        </p>
      </div>

      <Card className="flex flex-col gap-3">
        <h2 className="font-medium">Bookmarked</h2>
        {bookmarks.length === 0 ? (
          <p className="text-sm text-[var(--color-ink-soft)]">
            Nothing bookmarked yet. Use the bookmark button on lessons, recall questions, examples, and iʿrāb
            exercises.
          </p>
        ) : (
          <ul className="flex flex-col divide-y divide-[var(--color-border)]">
            {bookmarks.map((b) => {
              const { label, lessonId } = resolveRefLabel(b.refId)
              return (
                <li key={b.id} className="flex items-center justify-between gap-3 py-2">
                  <div className="flex flex-col">
                    <span className="text-xs uppercase tracking-wide text-[var(--color-ink-soft)]">{b.itemType}</span>
                    {lessonId ? (
                      <Link to={`/lesson/${lessonId}`} className="font-arabic text-base hover:underline">
                        {label}
                      </Link>
                    ) : (
                      <span className="font-arabic text-base">{label}</span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => removeBookmark(b.id)}
                    className="text-xs text-[var(--color-ink-soft)] hover:text-rose-600"
                  >
                    Remove
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </Card>

      <Card className="flex flex-col gap-3">
        <h2 className="font-medium">Auto-flagged as difficult</h2>
        <p className="text-xs text-[var(--color-ink-soft)]">
          Automatically added when you rate a previously-learned item "Again" - i.e. you forgot something you'd
          known.
        </p>
        {difficultTopics.length === 0 ? (
          <p className="text-sm text-[var(--color-ink-soft)]">Nothing here yet.</p>
        ) : (
          <ul className="flex flex-col divide-y divide-[var(--color-border)]">
            {difficultTopics.map((refId) => {
              const { label, lessonId } = resolveRefLabel(refId)
              return (
                <li key={refId} className="flex items-center justify-between gap-3 py-2">
                  {lessonId ? (
                    <Link to={`/lesson/${lessonId}`} className="font-arabic text-base hover:underline">
                      {label}
                    </Link>
                  ) : (
                    <span className="font-arabic text-base">{label}</span>
                  )}
                  <button
                    type="button"
                    onClick={() => removeDifficultTopic(refId)}
                    className="text-xs text-[var(--color-ink-soft)] hover:text-rose-600"
                  >
                    Clear
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </Card>
    </div>
  )
}
