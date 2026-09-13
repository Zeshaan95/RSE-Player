import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Card } from '@/components/Card'
import { getChapterForLesson, getLesson } from '@/lib/content'
import { useReviewStore } from '@/store/reviewStore'
import type { ConfidenceRating } from '@/types'

const SELF_RATINGS: { label: string; rating: ConfidenceRating }[] = [
  { label: 'Not at all', rating: 'again' },
  { label: 'A little', rating: 'difficult' },
  { label: 'Mostly', rating: 'good' },
  { label: 'Completely', rating: 'easy' },
]

export function ExplainPracticePage() {
  const { lessonId } = useParams<{ lessonId: string }>()
  const navigate = useNavigate()
  const lesson = lessonId ? getLesson(lessonId) : undefined
  const chapter = lessonId ? getChapterForLesson(lessonId) : undefined

  const [answer, setAnswer] = useState('')
  const [revealed, setRevealed] = useState(false)
  const rate = useReviewStore((s) => s.rate)
  const logFreeAnswer = useReviewStore((s) => s.logFreeAnswer)

  if (!lesson || !chapter) return <p className="text-sm text-[var(--color-ink-soft)]">Lesson not found.</p>

  function handleReveal() {
    logFreeAnswer({
      itemType: 'explain',
      refId: lesson!.id,
      reviewItemId: `explain:${lesson!.id}`,
      userAnswer: answer,
    })
    setRevealed(true)
  }

  function handleRate(rating: ConfidenceRating) {
    rate('explain', lesson!.id, lesson!.id, chapter!.id, rating)
    navigate('/explain')
  }

  return (
    <div className="flex flex-col gap-6">
      <Link to="/explain" className="text-xs text-[var(--color-ink-soft)] hover:underline">
        ← Explain It Yourself
      </Link>

      <Card className="flex flex-col gap-4">
        <div>
          <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-[var(--color-ink-soft)]">
            Explain in your own words
          </span>
          <p className="font-medium text-[var(--color-ink)]">
            What is <span className="font-arabic text-lg">{lesson.titleArabic}</span> ({lesson.titleEnglish})? Explain
            the rule as if teaching a beginner.
          </p>
        </div>
        <textarea
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          rows={5}
          disabled={revealed}
          placeholder="Type your explanation here before revealing the model answer..."
          className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-paper)] p-3 text-sm focus:border-[var(--color-accent)] focus:outline-none"
        />
        {!revealed && (
          <button
            type="button"
            onClick={handleReveal}
            className="self-start rounded-lg bg-[var(--color-accent)] px-4 py-2 text-sm font-medium text-white hover:opacity-90"
          >
            Reveal the model explanation
          </button>
        )}
      </Card>

      {revealed && (
        <Card className="flex flex-col gap-4">
          <div>
            <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-[var(--color-ink-soft)]">
              Model explanation
            </span>
            <p className="text-sm leading-relaxed text-[var(--color-ink)]">{lesson.explanation}</p>
          </div>
          <div className="flex flex-col gap-2 border-t border-[var(--color-border)] pt-3">
            <span className="text-sm font-medium">
              How confident are you that you could teach this concept to someone else?
            </span>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {SELF_RATINGS.map((r) => (
                <button
                  key={r.rating}
                  type="button"
                  onClick={() => handleRate(r.rating)}
                  className="rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm hover:border-[var(--color-accent)] hover:bg-[var(--color-accent-soft)]"
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}
