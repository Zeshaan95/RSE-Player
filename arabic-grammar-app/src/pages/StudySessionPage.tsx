import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Card } from '@/components/Card'
import { ArabicText } from '@/components/ArabicText'
import { ReviewRunner } from '@/components/ReviewRunner'
import { MemorisationConfidenceButtons } from '@/components/ConfidenceButtons'
import { compareRecall } from '@/lib/textCompare'
import { memorisationConfidenceToRating } from '@/lib/srs'
import { buildReviewQueue } from '@/lib/reviewQueue'
import { buildRunnerCard, type RunnerCard } from '@/lib/reviewRunner'
import { getNextLesson } from '@/lib/content'
import { useReviewStore } from '@/store/reviewStore'
import { useProgressStore } from '@/store/progressStore'
import { useSessionStore } from '@/store/sessionStore'
import type { StudySessionStep } from '@/types'

const STEP_ORDER: StudySessionStep[] = ['review', 'new_lesson', 'memorisation', 'grammar_recall', 'irab', 'reflection']

const STEP_LABELS: Record<StudySessionStep, string> = {
  review: '1. Review',
  new_lesson: '2. New lesson',
  memorisation: '3. Memorisation',
  grammar_recall: '4. Grammar recall',
  irab: '5. Iʿrāb',
  reflection: '6. Reflection',
}

export function StudySessionPage() {
  const [step, setStep] = useState<StudySessionStep | 'complete'>('review')
  const [reflection, setReflection] = useState('')

  const itemsMap = useReviewStore((s) => s.items)
  const items = useMemo(() => Object.values(itemsMap), [itemsMap])
  const rate = useReviewStore((s) => s.rate)
  const difficultTopics = useProgressStore((s) => s.difficultTopics)
  const recordReviewAttempt = useProgressStore((s) => s.recordReviewAttempt)
  const recordIrabAttempt = useProgressStore((s) => s.recordIrabAttempt)
  const recordStudyMinutes = useProgressStore((s) => s.recordStudyMinutes)
  const markLessonCompleted = useProgressStore((s) => s.markLessonCompleted)
  const currentLessonId = useProgressStore((s) => s.currentLessonId)
  const setCurrentLesson = useProgressStore((s) => s.setCurrentLesson)

  const startSession = useSessionStore((s) => s.startSession)
  const completeStep = useSessionStore((s) => s.completeStep)
  const finishSession = useSessionStore((s) => s.finishSession)

  const startedAt = useMemo(() => Date.now(), [])
  const newLesson = useMemo(() => getNextLesson(currentLessonId), [currentLessonId])

  useEffect(() => {
    startSession()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function advance(fromStep: StudySessionStep) {
    completeStep(fromStep)
    const idx = STEP_ORDER.indexOf(fromStep)
    setStep(STEP_ORDER[idx + 1] ?? 'reflection')
  }

  const reviewQueue = useMemo(() => {
    const grouped = buildReviewQueue(items, new Set(difficultTopics), { memorisation: 2, grammar: 2, irab: 1 })
    return [...grouped.memorisation, ...grouped.grammar, ...grouped.irab]
      .map(buildRunnerCard)
      .filter((c): c is RunnerCard => c !== null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (step === 'review') {
    return (
      <SessionShell step="review">
        <ReviewRunner
          cards={reviewQueue}
          emptyMessage="Nothing due for review right now - moving on to today's new lesson."
          onRate={(card, confidence) => {
            rate(card.itemType, card.refId, card.lessonId, card.chapterId, confidence)
            recordReviewAttempt(confidence !== 'again')
          }}
          onComplete={() => advance('review')}
        />
        {reviewQueue.length === 0 && (
          <button
            type="button"
            onClick={() => advance('review')}
            className="mt-4 self-start rounded-lg bg-[var(--color-accent)] px-4 py-2 text-sm font-medium text-white"
          >
            Continue →
          </button>
        )}
      </SessionShell>
    )
  }

  if (step === 'new_lesson') {
    return (
      <SessionShell step="new_lesson">
        {!newLesson ? (
          <Card className="flex flex-col gap-3">
            <p className="text-sm text-[var(--color-ink-soft)]">
              You've been introduced to every lesson currently in the curriculum. Great work - use the review and
              memorisation steps to keep consolidating.
            </p>
            <button
              type="button"
              onClick={() => advance('new_lesson')}
              className="self-start rounded-lg bg-[var(--color-accent)] px-4 py-2 text-sm font-medium text-white"
            >
              Continue →
            </button>
          </Card>
        ) : (
          <Card className="flex flex-col gap-4">
            <ArabicText size="xl" matn>
              {newLesson.matnArabic}
            </ArabicText>
            <p className="text-sm text-[var(--color-ink-soft)]">{newLesson.translation}</p>
            <p className="text-sm leading-relaxed">{newLesson.explanation}</p>
            <button
              type="button"
              onClick={() => {
                setCurrentLesson(newLesson.chapterId, newLesson.id)
                markLessonCompleted(newLesson.id)
                advance('new_lesson')
              }}
              className="self-start rounded-lg bg-[var(--color-accent)] px-4 py-2 text-sm font-medium text-white"
            >
              I've read this - continue →
            </button>
          </Card>
        )}
      </SessionShell>
    )
  }

  if (step === 'memorisation') {
    const section = newLesson?.memorisationSections[0]
    return (
      <SessionShell step="memorisation">
        {!section ? (
          <SkipCard onContinue={() => advance('memorisation')} message="No new passage to memorise today." />
        ) : (
          <MiniMemorisationStep
            arabicText={section.arabicText}
            translation={section.translation}
            onRate={(confidence) => {
              rate('memorisation', section.id, newLesson!.id, newLesson!.chapterId, memorisationConfidenceToRating(confidence))
              advance('memorisation')
            }}
          />
        )}
      </SessionShell>
    )
  }

  if (step === 'grammar_recall') {
    const cards: RunnerCard[] = (newLesson?.recallQuestions ?? []).slice(0, 2).map((q) => ({
      itemType: 'recall',
      refId: q.id,
      lessonId: newLesson!.id,
      chapterId: newLesson!.chapterId,
      frontArabic: q.questionArabic,
      frontText: q.questionEnglish,
      revealText: q.correctAnswer,
    }))
    return (
      <SessionShell step="grammar_recall">
        <ReviewRunner
          cards={cards}
          emptyMessage="No recall questions for today's lesson."
          onRate={(card, confidence) => {
            rate(card.itemType, card.refId, card.lessonId, card.chapterId, confidence)
            recordReviewAttempt(confidence !== 'again')
          }}
          onComplete={() => advance('grammar_recall')}
        />
        {cards.length === 0 && (
          <button
            type="button"
            onClick={() => advance('grammar_recall')}
            className="mt-4 self-start rounded-lg bg-[var(--color-accent)] px-4 py-2 text-sm font-medium text-white"
          >
            Continue →
          </button>
        )}
      </SessionShell>
    )
  }

  if (step === 'irab') {
    const exercise = newLesson?.irabExercises[0]
    const cards: RunnerCard[] = exercise
      ? [
          {
            itemType: 'irab',
            refId: exercise.id,
            lessonId: newLesson!.id,
            chapterId: newLesson!.chapterId,
            frontArabic: exercise.sentenceArabic,
            frontText: `Give the iʿrāb of: ${exercise.translation}`,
            revealText: exercise.tokens.map((t) => t.fullIrab ?? `${t.word}: ${t.role ?? t.wordType}`).join('\n'),
          },
        ]
      : []
    return (
      <SessionShell step="irab">
        <ReviewRunner
          cards={cards}
          emptyMessage="No iʿrāb exercise for today's lesson."
          onRate={(card, confidence) => {
            rate(card.itemType, card.refId, card.lessonId, card.chapterId, confidence)
            if (exercise) recordIrabAttempt(exercise.level, confidence !== 'again')
          }}
          onComplete={() => advance('irab')}
        />
        {cards.length === 0 && (
          <button
            type="button"
            onClick={() => advance('irab')}
            className="mt-4 self-start rounded-lg bg-[var(--color-accent)] px-4 py-2 text-sm font-medium text-white"
          >
            Continue →
          </button>
        )}
      </SessionShell>
    )
  }

  if (step === 'reflection') {
    return (
      <SessionShell step="reflection">
        <Card className="flex flex-col gap-3">
          <label className="text-sm font-medium" htmlFor="reflection">
            What did you find difficult today?
          </label>
          <textarea
            id="reflection"
            value={reflection}
            onChange={(e) => setReflection(e.target.value)}
            rows={4}
            placeholder="A word, a rule, a passage you kept forgetting..."
            className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-paper)] p-3 text-sm focus:border-[var(--color-accent)] focus:outline-none"
          />
          <button
            type="button"
            onClick={() => {
              completeStep('reflection')
              finishSession(reflection)
              const minutes = Math.max(1, Math.round((Date.now() - startedAt) / 60000))
              recordStudyMinutes(minutes)
              setStep('complete')
            }}
            className="self-start rounded-lg bg-[var(--color-accent)] px-4 py-2 text-sm font-medium text-white"
          >
            Finish session
          </button>
        </Card>
      </SessionShell>
    )
  }

  return (
    <div className="flex flex-col items-center gap-4 py-12 text-center">
      <h1 className="text-2xl font-semibold">Today's session complete.</h1>
      <p className="text-sm text-[var(--color-ink-soft)]">
        Well done. Consistency across short daily sessions is what builds lasting retention of the matn.
      </p>
      <Link to="/" className="rounded-lg bg-[var(--color-accent)] px-4 py-2 text-sm font-medium text-white hover:opacity-90">
        Back to dashboard
      </Link>
    </div>
  )
}

function SessionShell({ step, children }: { step: StudySessionStep; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap gap-2">
        {STEP_ORDER.map((s) => (
          <span
            key={s}
            className={`rounded-full px-2.5 py-1 text-xs ${
              s === step
                ? 'bg-[var(--color-accent)] text-white'
                : 'bg-[var(--color-accent-soft)] text-[var(--color-ink-soft)]'
            }`}
          >
            {STEP_LABELS[s]}
          </span>
        ))}
      </div>
      {children}
    </div>
  )
}

function SkipCard({ message, onContinue }: { message: string; onContinue: () => void }) {
  return (
    <Card className="flex flex-col gap-3">
      <p className="text-sm text-[var(--color-ink-soft)]">{message}</p>
      <button
        type="button"
        onClick={onContinue}
        className="self-start rounded-lg bg-[var(--color-accent)] px-4 py-2 text-sm font-medium text-white"
      >
        Continue →
      </button>
    </Card>
  )
}

function MiniMemorisationStep({
  arabicText,
  translation,
  onRate,
}: {
  arabicText: string
  translation: string
  onRate: (confidence: Parameters<typeof memorisationConfidenceToRating>[0]) => void
}) {
  const [stage, setStage] = useState<'read' | 'recall' | 'check'>('read')
  const [input, setInput] = useState('')

  if (stage === 'read') {
    return (
      <Card className="flex flex-col gap-4">
        <span className="text-xs uppercase tracking-wide text-[var(--color-ink-soft)]">Stage 1 · Read</span>
        <ArabicText size="xl" matn>
          {arabicText}
        </ArabicText>
        <p className="text-sm text-[var(--color-ink-soft)]">{translation}</p>
        <button
          type="button"
          onClick={() => setStage('recall')}
          className="self-start rounded-lg bg-[var(--color-accent)] px-4 py-2 text-sm font-medium text-white"
        >
          I'm ready to recall →
        </button>
      </Card>
    )
  }

  if (stage === 'recall') {
    return (
      <Card className="flex flex-col gap-4">
        <span className="text-xs uppercase tracking-wide text-[var(--color-ink-soft)]">Stage 2 · Recall</span>
        <textarea
          dir="rtl"
          lang="ar"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          rows={3}
          className="font-arabic w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-paper)] p-3 text-xl focus:border-[var(--color-accent)] focus:outline-none"
        />
        <button
          type="button"
          onClick={() => setStage('check')}
          className="self-start rounded-lg bg-[var(--color-accent)] px-4 py-2 text-sm font-medium text-white"
        >
          Check →
        </button>
      </Card>
    )
  }

  return (
    <Card className="flex flex-col gap-4">
      <span className="text-xs uppercase tracking-wide text-[var(--color-ink-soft)]">Stage 3 · Check</span>
      <div dir="rtl" className="font-arabic text-2xl leading-loose">
        {compareRecall(input, arabicText).map((w, idx) => (
          <span key={idx} className={w.matched ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-600 underline decoration-dotted'}>
            {w.word}{' '}
          </span>
        ))}
      </div>
      <span className="text-xs uppercase tracking-wide text-[var(--color-ink-soft)]">Stage 4 · Confidence</span>
      <MemorisationConfidenceButtons onRate={onRate} />
    </Card>
  )
}
