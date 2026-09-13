import { Link } from 'react-router-dom'
import { Card } from '@/components/Card'
import { ProgressBar } from '@/components/ProgressBar'
import { getAllIrabExercises } from '@/lib/content'
import { LEVEL_DESCRIPTIONS, buildIrabPrompts } from '@/lib/irabPractice'
import { useProgressStore } from '@/store/progressStore'
import type { IrabLevel } from '@/types'

const LEVELS: IrabLevel[] = [1, 2, 3, 4, 5]

export function IrabHubPage() {
  const skillProgress = useProgressStore((s) => s.irabSkillProgress)
  const exercises = getAllIrabExercises()

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Iʿrāb Practice</h1>
        <p className="text-sm text-[var(--color-ink-soft)]">
          Progressive levels of practical grammatical analysis (إعراب), from identifying word types to producing a
          full traditional iʿrāb statement.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {LEVELS.map((level) => {
          const info = LEVEL_DESCRIPTIONS[level]
          const promptCount = buildIrabPrompts(exercises, level).length
          const stat = skillProgress[level]
          const pct = stat.attempts ? Math.round((stat.correct / stat.attempts) * 100) : null
          return (
            <Card key={level} className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase tracking-wide text-[var(--color-ink-soft)]">Level {level}</span>
                {pct !== null && <span className="text-xs text-[var(--color-ink-soft)]">{pct}% accuracy</span>}
              </div>
              <h2 className="font-medium">{info.title}</h2>
              <p className="text-sm text-[var(--color-ink-soft)]">{info.description}</p>
              {stat.attempts > 0 && <ProgressBar value={stat.correct} max={stat.attempts} />}
              {promptCount === 0 ? (
                <span className="text-xs text-amber-700">No exercises available yet at this level.</span>
              ) : (
                <Link
                  to={`/irab/${level}`}
                  className="self-start rounded-lg bg-[var(--color-accent)] px-4 py-2 text-sm font-medium text-white hover:opacity-90"
                >
                  Practice ({promptCount} prompts)
                </Link>
              )}
            </Card>
          )
        })}
      </div>
    </div>
  )
}
