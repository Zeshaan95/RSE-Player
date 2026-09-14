import { Link } from 'react-router-dom'
import { Card } from '@/components/Card'
import { lessons } from '@/lib/content'
import { useReviewStore } from '@/store/reviewStore'

export function ExplainHubPage() {
  const items = useReviewStore((s) => s.items)
  const realLessons = lessons.filter((l) => !l.isPlaceholder)

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Explain It Yourself</h1>
        <p className="text-sm text-[var(--color-ink-soft)]">
          Pick a concept and explain it in your own words before seeing the model explanation. This checks
          understanding, not just recognition.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {realLessons.map((lesson) => {
          const record = items[`explain:${lesson.id}`]
          return (
            <Card key={lesson.id} className="flex flex-col gap-2">
              <span className="font-arabic text-lg">{lesson.titleArabic}</span>
              <span className="text-sm text-[var(--color-ink-soft)]">{lesson.titleEnglish}</span>
              {record && (
                <span className="text-xs text-[var(--color-ink-soft)]">
                  Last self-rating: {record.lastConfidence ?? '—'} · status: {record.status}
                </span>
              )}
              <Link
                to={`/explain/${lesson.id}`}
                className="mt-1 self-start rounded-lg border border-[var(--color-border)] px-3 py-1.5 text-sm hover:border-[var(--color-accent)]"
              >
                Explain this concept
              </Link>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
