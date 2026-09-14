import { useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Card } from '@/components/Card'
import { StatTile } from '@/components/StatTile'
import { ProgressBar } from '@/components/ProgressBar'
import { ArabicInline } from '@/components/ArabicText'
import { useProgressStore } from '@/store/progressStore'
import { useReviewStore } from '@/store/reviewStore'
import { chapters, getChapter, getLesson, getNextLesson, lessons } from '@/lib/content'
import { dueCounts, newCount, nextDue } from '@/lib/reviewQueue'

function formatRelative(iso: string): string {
  const diffMs = new Date(iso).getTime() - Date.now()
  const diffMin = Math.round(diffMs / 60000)
  if (diffMin <= 0) return 'now'
  if (diffMin < 60) return `in ${diffMin} min`
  const diffHr = Math.round(diffMin / 60)
  if (diffHr < 24) return `in ${diffHr}h`
  const diffDay = Math.round(diffHr / 24)
  return `in ${diffDay}d`
}

export function DashboardPage() {
  const navigate = useNavigate()
  const progress = useProgressStore()
  const itemsMap = useReviewStore((s) => s.items)
  const items = useMemo(() => Object.values(itemsMap), [itemsMap])

  const realLessons = lessons.filter((l) => !l.isPlaceholder)
  const currentLesson = progress.currentLessonId ? getLesson(progress.currentLessonId) : undefined
  const currentChapter = progress.currentChapterId ? getChapter(progress.currentChapterId) : undefined
  const upNext = getNextLesson(progress.currentLessonId)

  const due = dueCounts(items)
  const fresh = newCount(items)
  const next = nextDue(items)

  const memItems = items.filter((i) => i.itemType === 'memorisation')
  const memMastered = memItems.filter((i) => i.status === 'mastered').length

  const todayMinutes = progress.todayStudyMinutes()

  const irabAcc = progress.irabAccuracyOverall
  const irabPct = irabAcc.attempts ? Math.round((irabAcc.correct / irabAcc.attempts) * 100) : null

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold text-[var(--color-ink)]">Dashboard</h1>
        <p className="text-sm text-[var(--color-ink-soft)]">
          Your study companion for <ArabicInline>الآجرومية</ArabicInline>, the classical primer of Arabic
          grammar.
        </p>
      </div>

      <Card className="flex flex-col gap-4 bg-[var(--color-accent-soft)]/40">
        <div className="flex flex-col gap-1">
          <span className="text-xs uppercase tracking-wide text-[var(--color-ink-soft)]">
            {currentChapter ? currentChapter.titleEnglish : 'Get started'}
          </span>
          <span className="font-arabic text-2xl">
            {currentLesson ? currentLesson.titleArabic : upNext?.titleArabic ?? 'الكلام'}
          </span>
          <span className="text-sm text-[var(--color-ink-soft)]">
            {currentLesson ? currentLesson.titleEnglish : upNext?.titleEnglish}
          </span>
        </div>
        <button
          type="button"
          onClick={() => navigate('/study')}
          className="w-full rounded-lg bg-[var(--color-accent)] px-4 py-3 text-center font-medium text-white transition-opacity hover:opacity-90 sm:w-auto"
        >
          Continue studying →
        </button>
      </Card>

      <Card className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Today's goal</span>
          <span className="text-sm text-[var(--color-ink-soft)]">
            {todayMinutes} / {progress.dailyGoalMinutes} min
          </span>
        </div>
        <ProgressBar value={todayMinutes} max={progress.dailyGoalMinutes} />
      </Card>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        <StatTile label="Study streak" value={`🔥 ${progress.streakDays}d`} />
        <StatTile label="Due for review" value={due.total} sub="today" />
        <StatTile label="New to learn" value={fresh} />
        <StatTile label="Concepts mastered" value={progress.conceptsMastered.length} />
        <StatTile
          label="Iʿrāb accuracy"
          value={irabPct === null ? '—' : `${irabPct}%`}
          sub={`${irabAcc.correct}/${irabAcc.attempts} attempts`}
        />
        <StatTile
          label="Next review"
          value={next ? formatRelative(next.dueAt) : 'All clear'}
        />
        <StatTile label="Chapters completed" value={`${progress.chaptersCompleted.length}/${chapters.length}`} />
        <StatTile label="Total study time" value={`${progress.totalStudyMinutes} min`} />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="flex flex-col gap-3">
          <h2 className="font-medium">Matn memorisation progress</h2>
          <ProgressBar value={memMastered} max={memItems.length || 1} label={`${memMastered} of ${memItems.length} sections mastered`} />
        </Card>
        <Card className="flex flex-col gap-3">
          <h2 className="font-medium">Overall progress through al-Ājurrūmiyyah</h2>
          <ProgressBar
            value={progress.lessonsCompleted.length}
            max={realLessons.length}
            label={`${progress.lessonsCompleted.length} of ${realLessons.length} lessons`}
          />
        </Card>
      </div>

      <div className="flex flex-wrap gap-3">
        <Link
          to="/review"
          className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2 text-sm font-medium hover:border-[var(--color-accent)]"
        >
          Today's Review ({due.total})
        </Link>
        <Link
          to="/curriculum"
          className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2 text-sm font-medium hover:border-[var(--color-accent)]"
        >
          Browse curriculum
        </Link>
        <Link
          to="/irab"
          className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2 text-sm font-medium hover:border-[var(--color-accent)]"
        >
          Iʿrāb practice
        </Link>
      </div>
    </div>
  )
}
