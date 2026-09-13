import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Card } from '@/components/Card'
import { ArabicText } from '@/components/ArabicText'
import { ConfidenceButtons } from '@/components/ConfidenceButtons'
import { BookmarkButton } from '@/components/BookmarkButton'
import { getChapterForLesson, getLesson } from '@/lib/content'
import { useReviewStore } from '@/store/reviewStore'
import { useProgressStore } from '@/store/progressStore'
import type { ConfidenceRating } from '@/types'

export function RecallPracticePage() {
  const { lessonId } = useParams<{ lessonId: string }>()
  const lesson = lessonId ? getLesson(lessonId) : undefined
  const chapter = lessonId ? getChapterForLesson(lessonId) : undefined

  const [index, setIndex] = useState(0)
  const [revealed, setRevealed] = useState(false)
  const [selected, setSelected] = useState<string | null>(null)
  const [freeAnswer, setFreeAnswer] = useState('')

  const rate = useReviewStore((s) => s.rate)
  const recordReviewAttempt = useProgressStore((s) => s.recordReviewAttempt)
  const recordStudyMinutes = useProgressStore((s) => s.recordStudyMinutes)
  const startedAt = useMemo(() => Date.now(), [lessonId])

  useEffect(() => {
    return () => {
      const minutes = Math.max(1, Math.round((Date.now() - startedAt) / 60000))
      recordStudyMinutes(minutes)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (!lesson || !chapter) return <p className="text-sm text-[var(--color-ink-soft)]">Lesson not found.</p>

  const questions = lesson.recallQuestions
  if (questions.length === 0 || index >= questions.length) {
    return (
      <div className="flex flex-col gap-4">
        <Card className="text-center">
          <h1 className="text-xl font-semibold">
            {questions.length === 0 ? 'No recall questions available yet' : 'Recall practice complete'}
          </h1>
        </Card>
        <div className="flex justify-center gap-3">
          <Link to={`/lesson/${lesson.id}`} className="rounded-lg border border-[var(--color-border)] px-4 py-2 text-sm hover:border-[var(--color-accent)]">
            Back to lesson
          </Link>
        </div>
      </div>
    )
  }

  const question = questions[index]
  const isMcqCorrect = question.type === 'mcq' && selected === question.correctAnswer

  function handleReveal() {
    setRevealed(true)
  }

  function handleRate(confidence: ConfidenceRating) {
    rate('recall', question.id, lesson!.id, chapter!.id, confidence)
    const correct = question.type === 'mcq' ? isMcqCorrect : confidence !== 'again'
    recordReviewAttempt(correct)
    setRevealed(false)
    setSelected(null)
    setFreeAnswer('')
    setIndex((i) => i + 1)
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <Link to={`/lesson/${lesson.id}`} className="text-xs text-[var(--color-ink-soft)] hover:underline">
          ← {lesson.titleEnglish}
        </Link>
        <span className="text-xs text-[var(--color-ink-soft)]">
          Question {index + 1} of {questions.length}
        </span>
      </div>

      <Card className="flex flex-col gap-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-col gap-1">
            {question.questionArabic && <ArabicText size="lg">{question.questionArabic}</ArabicText>}
            <p className="font-medium text-[var(--color-ink)]">{question.questionEnglish}</p>
          </div>
          <BookmarkButton itemType="recall" refId={question.id} lessonId={lesson.id} />
        </div>

        {question.type === 'mcq' && question.options && (
          <div className="flex flex-col gap-2">
            {question.options.map((opt) => {
              const isSelected = selected === opt
              const showCorrectness = revealed
              const isCorrectOption = opt === question.correctAnswer
              return (
                <button
                  key={opt}
                  type="button"
                  disabled={revealed}
                  onClick={() => setSelected(opt)}
                  className={`rounded-lg border px-3 py-2 text-left text-sm transition-colors ${
                    showCorrectness && isCorrectOption
                      ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30'
                      : showCorrectness && isSelected && !isCorrectOption
                        ? 'border-rose-500 bg-rose-50 dark:bg-rose-950/30'
                        : isSelected
                          ? 'border-[var(--color-accent)] bg-[var(--color-accent-soft)]'
                          : 'border-[var(--color-border)] hover:border-[var(--color-accent)]'
                  }`}
                >
                  <ArabicText size="sm" className="inline">
                    {opt}
                  </ArabicText>
                </button>
              )
            })}
            {!revealed && (
              <button
                type="button"
                disabled={!selected}
                onClick={handleReveal}
                className="mt-2 self-start rounded-lg bg-[var(--color-accent)] px-4 py-2 text-sm font-medium text-white disabled:opacity-40"
              >
                Reveal answer
              </button>
            )}
          </div>
        )}

        {question.type === 'free' && (
          <div className="flex flex-col gap-2">
            <textarea
              value={freeAnswer}
              onChange={(e) => setFreeAnswer(e.target.value)}
              rows={3}
              placeholder="Attempt an answer from memory before revealing..."
              disabled={revealed}
              className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-paper)] p-3 text-sm focus:border-[var(--color-accent)] focus:outline-none"
            />
            {!revealed && (
              <button
                type="button"
                onClick={handleReveal}
                className="self-start rounded-lg bg-[var(--color-accent)] px-4 py-2 text-sm font-medium text-white"
              >
                Reveal answer
              </button>
            )}
          </div>
        )}

        {revealed && (
          <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-accent-soft)]/40 p-3">
            <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-[var(--color-ink-soft)]">
              Answer
            </span>
            <p className="text-sm text-[var(--color-ink)]">{question.correctAnswer}</p>
            {question.hint && <p className="mt-1 text-xs text-[var(--color-ink-soft)]">Hint: {question.hint}</p>}
          </div>
        )}

        {revealed && (
          <div className="flex flex-col gap-2 border-t border-[var(--color-border)] pt-3">
            <span className="text-xs font-medium uppercase tracking-wide text-[var(--color-ink-soft)]">
              How well did you know this?
            </span>
            <ConfidenceButtons onRate={handleRate} />
          </div>
        )}
      </Card>
    </div>
  )
}
