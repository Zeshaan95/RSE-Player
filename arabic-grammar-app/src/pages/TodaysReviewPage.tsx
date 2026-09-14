import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Card } from '@/components/Card'
import { ReviewRunner } from '@/components/ReviewRunner'
import { useReviewStore } from '@/store/reviewStore'
import { useProgressStore } from '@/store/progressStore'
import { useSettingsStore } from '@/store/settingsStore'
import { buildReviewQueue, dueCounts } from '@/lib/reviewQueue'
import { buildRunnerCard, type RunnerCard } from '@/lib/reviewRunner'
import type { ConfidenceRating } from '@/types'

export function TodaysReviewPage() {
  const itemsMap = useReviewStore((s) => s.items)
  const items = useMemo(() => Object.values(itemsMap), [itemsMap])
  const rate = useReviewStore((s) => s.rate)
  const difficultTopics = useProgressStore((s) => s.difficultTopics)
  const recordReviewAttempt = useProgressStore((s) => s.recordReviewAttempt)
  const recordStudyMinutes = useProgressStore((s) => s.recordStudyMinutes)
  const sizes = useSettingsStore((s) => s.reviewSessionSizes)
  const setReviewSessionSizes = useSettingsStore((s) => s.setReviewSessionSizes)

  const due = dueCounts(items)
  const [localSizes, setLocalSizes] = useState(sizes)
  const [phase, setPhase] = useState<'setup' | 'running' | 'done'>('setup')
  const [queue, setQueue] = useState<RunnerCard[]>([])
  const startedAt = useMemo(() => Date.now(), [])

  useEffect(() => {
    return () => {
      const minutes = Math.round((Date.now() - startedAt) / 60000)
      if (minutes > 0) recordStudyMinutes(minutes)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function startSession() {
    setReviewSessionSizes(localSizes)
    const grouped = buildReviewQueue(items, new Set(difficultTopics), localSizes)
    const built = [...grouped.memorisation, ...grouped.grammar, ...grouped.irab]
      .map(buildRunnerCard)
      .filter((c): c is RunnerCard => c !== null)
    setQueue(built)
    setPhase(built.length > 0 ? 'running' : 'done')
  }

  function handleRate(card: RunnerCard, confidence: ConfidenceRating) {
    rate(card.itemType, card.refId, card.lessonId, card.chapterId, confidence)
    recordReviewAttempt(confidence !== 'again')
  }

  if (phase === 'setup') {
    return (
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-semibold">Today's Review</h1>
          <p className="text-sm text-[var(--color-ink-soft)]">
            A manageable, mixed session drawn from what's due: memorisation, grammar recall, and iʿrāb - with
            difficult/bookmarked topics surfaced first.
          </p>
        </div>

        <Card className="flex flex-col gap-4">
          <h2 className="font-medium">Session size (today's target)</h2>
          {(
            [
              ['memorisation', 'Memorisation reviews', due.memorisation],
              ['grammar', 'Grammar / recall questions', due.recall + due.explain],
              ['irab', 'Iʿrāb exercises', due.irab],
            ] as const
          ).map(([key, label, availableCount]) => (
            <div key={key} className="flex items-center justify-between gap-3">
              <label className="text-sm text-[var(--color-ink-soft)]" htmlFor={key}>
                {label} <span className="text-xs">({availableCount} due)</span>
              </label>
              <input
                id={key}
                type="number"
                min={0}
                max={50}
                value={localSizes[key]}
                onChange={(e) =>
                  setLocalSizes((s) => ({ ...s, [key]: Math.max(0, Number(e.target.value) || 0) }))
                }
                className="w-20 rounded-lg border border-[var(--color-border)] bg-[var(--color-paper)] px-2 py-1 text-sm"
              />
            </div>
          ))}
          <button
            type="button"
            onClick={startSession}
            className="self-start rounded-lg bg-[var(--color-accent)] px-4 py-2 text-sm font-medium text-white hover:opacity-90"
          >
            Start review session
          </button>
        </Card>
      </div>
    )
  }

  if (phase === 'done') {
    return (
      <div className="flex flex-col gap-4">
        <Card className="text-center">
          <h1 className="text-xl font-semibold">
            {queue.length === 0 ? 'Nothing due right now' : "Today's review complete"}
          </h1>
          <p className="mt-1 text-sm text-[var(--color-ink-soft)]">
            {queue.length === 0
              ? 'Check back later, or explore the curriculum to learn something new.'
              : `You reviewed ${queue.length} item${queue.length === 1 ? '' : 's'}.`}
          </p>
        </Card>
        <div className="flex justify-center gap-3">
          <Link to="/" className="rounded-lg border border-[var(--color-border)] px-4 py-2 text-sm hover:border-[var(--color-accent)]">
            Back to dashboard
          </Link>
          <Link to="/curriculum" className="rounded-lg bg-[var(--color-accent)] px-4 py-2 text-sm font-medium text-white hover:opacity-90">
            Browse curriculum
          </Link>
        </div>
      </div>
    )
  }

  return <ReviewRunner cards={queue} onRate={handleRate} onComplete={() => setPhase('done')} />
}
