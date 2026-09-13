import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Card } from '@/components/Card'
import { ArabicText } from '@/components/ArabicText'
import { MemorisationConfidenceButtons } from '@/components/ConfidenceButtons'
import { getChapterForLesson, getLesson } from '@/lib/content'
import { compareRecall } from '@/lib/textCompare'
import { memorisationConfidenceToRating } from '@/lib/srs'
import { useReviewStore } from '@/store/reviewStore'
import { useProgressStore } from '@/store/progressStore'
import type { MasteryStatus, MemorisationConfidence } from '@/types'

type Stage = 'read' | 'recall' | 'check' | 'done'

export function MemorisationPage() {
  const { lessonId } = useParams<{ lessonId: string }>()
  const lesson = lessonId ? getLesson(lessonId) : undefined
  const chapter = lessonId ? getChapterForLesson(lessonId) : undefined

  const [sectionIndex, setSectionIndex] = useState(0)
  const [stage, setStage] = useState<Stage>('read')
  const [recallInput, setRecallInput] = useState('')
  const [ratedCount, setRatedCount] = useState(0)

  const rate = useReviewStore((s) => s.rate)
  const setStatus = useReviewStore((s) => s.setStatus)
  const recordStudyMinutes = useProgressStore((s) => s.recordStudyMinutes)

  const startedAt = useMemo(() => Date.now(), [lessonId]);

  useEffect(() => {
    return () => {
      const minutes = Math.max(1, Math.round((Date.now() - startedAt) / 60000))
      recordStudyMinutes(minutes)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (!lesson || !chapter) return <p className="text-sm text-[var(--color-ink-soft)]">Lesson not found.</p>

  const sections = lesson.memorisationSections
  if (sections.length === 0) {
    return (
      <div className="flex flex-col gap-4">
        <p className="text-sm text-[var(--color-ink-soft)]">
          This lesson has no matn passage set up for memorisation yet.
        </p>
        <Link to={`/lesson/${lesson.id}`} className="text-sm text-[var(--color-accent)] hover:underline">
          ← Back to lesson
        </Link>
      </div>
    )
  }

  if (stage === 'done' || sectionIndex >= sections.length) {
    return (
      <div className="flex flex-col gap-4">
        <Card className="flex flex-col gap-2 text-center">
          <h1 className="text-xl font-semibold">Memorisation session complete</h1>
          <p className="text-sm text-[var(--color-ink-soft)]">
            You reviewed {ratedCount} of {sections.length} passage{sections.length === 1 ? '' : 's'} from{' '}
            <span className="font-arabic">{lesson.titleArabic}</span>.
          </p>
        </Card>
        <div className="flex justify-center gap-3">
          <Link to={`/lesson/${lesson.id}`} className="rounded-lg border border-[var(--color-border)] px-4 py-2 text-sm hover:border-[var(--color-accent)]">
            Back to lesson
          </Link>
          <Link to="/review" className="rounded-lg bg-[var(--color-accent)] px-4 py-2 text-sm font-medium text-white hover:opacity-90">
            Go to Today's Review
          </Link>
        </div>
      </div>
    )
  }

  const section = sections[sectionIndex]

  function goNext() {
    setRecallInput('')
    if (sectionIndex + 1 >= sections.length) {
      setStage('done')
    } else {
      setSectionIndex((i) => i + 1)
      setStage('read')
    }
  }

  function handleConfidence(confidence: MemorisationConfidence) {
    const rating = memorisationConfidenceToRating(confidence)
    rate('memorisation', section.id, lesson!.id, chapter!.id, rating)
    setRatedCount((c) => c + 1)
    goNext()
  }

  function handleManualStatus(status: MasteryStatus) {
    setStatus('memorisation', section.id, lesson!.id, chapter!.id, status)
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <Link to={`/lesson/${lesson.id}`} className="text-xs text-[var(--color-ink-soft)] hover:underline">
          ← {lesson.titleEnglish}
        </Link>
        <span className="text-xs text-[var(--color-ink-soft)]">
          Passage {sectionIndex + 1} of {sections.length}
        </span>
      </div>

      <h1 className="text-xl font-semibold">Matn Memorisation</h1>

      {stage === 'read' && (
        <Card className="flex flex-col gap-4">
          <span className="text-xs font-medium uppercase tracking-wide text-[var(--color-ink-soft)]">
            Stage 1 · Read
          </span>
          <ArabicText size="xl" matn>
            {section.arabicText}
          </ArabicText>
          <p className="text-sm text-[var(--color-ink-soft)]">{section.translation}</p>
          <button
            type="button"
            onClick={() => setStage('recall')}
            className="self-start rounded-lg bg-[var(--color-accent)] px-4 py-2 text-sm font-medium text-white hover:opacity-90"
          >
            I'm ready to recall →
          </button>
        </Card>
      )}

      {stage === 'recall' && (
        <Card className="flex flex-col gap-4">
          <span className="text-xs font-medium uppercase tracking-wide text-[var(--color-ink-soft)]">
            Stage 2 · Recall from memory
          </span>
          <p className="text-sm text-[var(--color-ink-soft)]">{section.translation}</p>
          <p className="text-sm italic text-[var(--color-ink-soft)]">
            Type or recite the Arabic passage from memory. The text is hidden.
          </p>
          <textarea
            dir="rtl"
            lang="ar"
            value={recallInput}
            onChange={(e) => setRecallInput(e.target.value)}
            rows={4}
            placeholder="اكتب من حفظك..."
            className="font-arabic w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-paper)] p-3 text-xl focus:border-[var(--color-accent)] focus:outline-none"
          />
          <button
            type="button"
            onClick={() => setStage('check')}
            className="self-start rounded-lg bg-[var(--color-accent)] px-4 py-2 text-sm font-medium text-white hover:opacity-90"
          >
            Check my answer →
          </button>
        </Card>
      )}

      {stage === 'check' && (
        <Card className="flex flex-col gap-4">
          <span className="text-xs font-medium uppercase tracking-wide text-[var(--color-ink-soft)]">
            Stage 3 · Check
          </span>
          <div>
            <span className="mb-1 block text-xs text-[var(--color-ink-soft)]">Your attempt</span>
            <ArabicText size="lg" className="text-[var(--color-ink-soft)]">
              {recallInput || '(nothing typed)'}
            </ArabicText>
          </div>
          <div>
            <span className="mb-1 block text-xs text-[var(--color-ink-soft)]">Correct text</span>
            <div dir="rtl" className="font-arabic text-2xl leading-loose">
              {compareRecall(recallInput, section.arabicText).map((w, idx) => (
                <span
                  key={idx}
                  className={w.matched ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-600 underline decoration-dotted'}
                >
                  {w.word}{' '}
                </span>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-xs font-medium uppercase tracking-wide text-[var(--color-ink-soft)]">
              Stage 4 · How well did you know it?
            </span>
            <MemorisationConfidenceButtons onRate={handleConfidence} />
          </div>

          <div className="flex flex-wrap items-center gap-2 border-t border-[var(--color-border)] pt-3">
            <span className="text-xs text-[var(--color-ink-soft)]">Or set status directly:</span>
            <button
              type="button"
              onClick={() => handleManualStatus('mastered')}
              className="rounded-md border border-emerald-500 px-2 py-1 text-xs text-emerald-700 hover:bg-emerald-50"
            >
              Memorised
            </button>
            <button
              type="button"
              onClick={() => handleManualStatus('learning')}
              className="rounded-md border border-amber-500 px-2 py-1 text-xs text-amber-700 hover:bg-amber-50"
            >
              Learning
            </button>
            <button
              type="button"
              onClick={() => handleManualStatus('needs_review')}
              className="rounded-md border border-rose-500 px-2 py-1 text-xs text-rose-700 hover:bg-rose-50"
            >
              Needs review
            </button>
          </div>
        </Card>
      )}
    </div>
  )
}
