import { Card } from '@/components/Card'
import { useProgressStore } from '@/store/progressStore'
import { useSettingsStore } from '@/store/settingsStore'

export function SettingsPage() {
  const dailyGoalMinutes = useProgressStore((s) => s.dailyGoalMinutes)
  const setDailyGoal = useProgressStore((s) => s.setDailyGoal)

  const theme = useSettingsStore((s) => s.theme)
  const setTheme = useSettingsStore((s) => s.setTheme)
  const reviewSessionSizes = useSettingsStore((s) => s.reviewSessionSizes)
  const setReviewSessionSizes = useSettingsStore((s) => s.setReviewSessionSizes)

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Settings</h1>
        <p className="text-sm text-[var(--color-ink-soft)]">
          All your study data is stored locally in this browser. Nothing is sent anywhere.
        </p>
      </div>

      <Card className="flex flex-col gap-3">
        <h2 className="font-medium">Daily goal</h2>
        <div className="flex items-center gap-3">
          <input
            type="number"
            min={5}
            max={240}
            value={dailyGoalMinutes}
            onChange={(e) => setDailyGoal(Number(e.target.value) || 5)}
            className="w-24 rounded-lg border border-[var(--color-border)] bg-[var(--color-paper)] px-3 py-2 text-sm"
          />
          <span className="text-sm text-[var(--color-ink-soft)]">minutes per day</span>
        </div>
      </Card>

      <Card className="flex flex-col gap-3">
        <h2 className="font-medium">Default review session size</h2>
        <p className="text-xs text-[var(--color-ink-soft)]">
          You can also adjust these on the Today's Review page before starting a session.
        </p>
        {(
          [
            ['memorisation', 'Memorisation reviews'],
            ['grammar', 'Grammar / recall questions'],
            ['irab', 'Iʿrāb exercises'],
          ] as const
        ).map(([key, label]) => (
          <div key={key} className="flex items-center justify-between gap-3">
            <label className="text-sm text-[var(--color-ink-soft)]" htmlFor={`size-${key}`}>
              {label}
            </label>
            <input
              id={`size-${key}`}
              type="number"
              min={0}
              max={50}
              value={reviewSessionSizes[key]}
              onChange={(e) =>
                setReviewSessionSizes({ ...reviewSessionSizes, [key]: Math.max(0, Number(e.target.value) || 0) })
              }
              className="w-20 rounded-lg border border-[var(--color-border)] bg-[var(--color-paper)] px-2 py-1 text-sm"
            />
          </div>
        ))}
      </Card>

      <Card className="flex flex-col gap-3">
        <h2 className="font-medium">Appearance</h2>
        <div className="flex gap-2">
          {(['light', 'dark', 'system'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTheme(t)}
              className={`rounded-lg border px-3 py-1.5 text-sm capitalize ${
                theme === t
                  ? 'border-[var(--color-accent)] bg-[var(--color-accent-soft)] text-[var(--color-accent)]'
                  : 'border-[var(--color-border)] text-[var(--color-ink-soft)]'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </Card>
    </div>
  )
}
