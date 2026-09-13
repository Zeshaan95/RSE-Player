import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Card } from '@/components/Card'
import { StatTile } from '@/components/StatTile'
import { ProgressBar } from '@/components/ProgressBar'
import { useProgressStore } from '@/store/progressStore'
import { useReviewStore } from '@/store/reviewStore'
import { chapters, lessons } from '@/lib/content'
import type { IrabLevel } from '@/types'

const LEVELS: IrabLevel[] = [1, 2, 3, 4, 5]

export function ProgressPage() {
  const progress = useProgressStore()
  const itemsMap = useReviewStore((s) => s.items)
  const items = useMemo(() => Object.values(itemsMap), [itemsMap])
  const realLessons = lessons.filter((l) => !l.isPlaceholder)

  const memItems = items.filter((i) => i.itemType === 'memorisation')
  const memMastered = memItems.filter((i) => i.status === 'mastered').length

  const reviewAcc = progress.reviewAccuracy
  const reviewPct = reviewAcc.attempts ? Math.round((reviewAcc.correct / reviewAcc.attempts) * 100) : null

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Progress</h1>
        <p className="text-sm text-[var(--color-ink-soft)]">
          A record of retention, not a scoreboard - the point is what you remember, not points collected.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        <StatTile label="Current streak" value={`${progress.streakDays} day${progress.streakDays === 1 ? '' : 's'}`} />
        <StatTile label="Total study time" value={`${progress.totalStudyMinutes} min`} />
        <StatTile label="Chapters completed" value={`${progress.chaptersCompleted.length}/${chapters.length}`} />
        <StatTile label="Lessons completed" value={`${progress.lessonsCompleted.length}/${realLessons.length}`} />
        <StatTile label="Concepts mastered" value={progress.conceptsMastered.length} />
        <StatTile label="Review accuracy" value={reviewPct === null ? '—' : `${reviewPct}%`} />
        <StatTile label="Difficult topics" value={progress.difficultTopics.length} />
        <StatTile label="Longest retention" value={`${progress.longestRetentionDays}d`} />
      </div>

      <Card className="flex flex-col gap-3">
        <h2 className="font-medium">Matn memorisation</h2>
        <ProgressBar
          value={memMastered}
          max={memItems.length || 1}
          label={`${memMastered} of ${memItems.length} passages mastered`}
        />
      </Card>

      <Card className="flex flex-col gap-3">
        <h2 className="font-medium">Iʿrāb accuracy by level</h2>
        <div className="flex flex-col gap-2">
          {LEVELS.map((level) => {
            const s = progress.irabSkillProgress[level]
            return (
              <div key={level} className="flex items-center gap-3">
                <span className="w-16 text-xs text-[var(--color-ink-soft)]">Level {level}</span>
                <ProgressBar value={s.correct} max={s.attempts || 1} className="flex-1" />
                <span className="w-20 text-right text-xs text-[var(--color-ink-soft)]">
                  {s.attempts ? `${Math.round((s.correct / s.attempts) * 100)}%` : '—'}
                </span>
              </div>
            )
          })}
        </div>
      </Card>

      {progress.forgottenTopics.length > 0 && (
        <Card className="flex flex-col gap-2">
          <h2 className="font-medium">Recently forgotten</h2>
          <p className="text-sm text-[var(--color-ink-soft)]">
            {progress.forgottenTopics.length} item{progress.forgottenTopics.length === 1 ? '' : 's'} lapsed back to
            "needs review" after being learned. These are prioritised in your review sessions.
          </p>
        </Card>
      )}

      <Link to="/bookmarks" className="self-start text-sm text-[var(--color-accent)] hover:underline">
        View My Difficult Topics →
      </Link>
    </div>
  )
}
