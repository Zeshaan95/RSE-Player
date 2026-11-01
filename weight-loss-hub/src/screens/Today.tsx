import { useState } from 'react'
import { useDaily, useSettings, useToday, useWorkouts } from '../hooks'
import { addDays, daysBetween, fmtDate, fmtLong } from '../lib/dates'
import { sessionFor } from '../lib/schedule'
import { sevenDayAvg, statusFor, targetFor } from '../lib/weight'
import { fmtStLb } from '../lib/units'
import { GOAL, EXERCISES } from '../plan'
import { Card, Stat, StatusPill } from '../components/ui'
import { QuickWeighIn } from '../components/WeighInForm'
import { HabitForm } from '../components/HabitForm'
import { SessionCard } from '../components/SessionCard'
import { strengthWarnings, WARNING_TEXT } from '../lib/strength'

export default function Today() {
  const today = useToday()
  const [offset, setOffset] = useState(0)
  const date = addDays(today, offset)
  const isToday = offset === 0
  const settings = useSettings()
  const daily = useDaily()
  const workouts = useWorkouts()

  const session = sessionFor(date, { footballPaused: settings.footballPausedForHolidays })
  const avg = sevenDayAvg(daily, date)
  const target = targetFor(date)
  const status = statusFor(avg, target)
  const latest = [...daily.entries()].filter(([d]) => d <= date).at(-1)
  const current = avg ?? latest?.[1] ?? null
  const warnings = strengthWarnings(workouts)

  return (
    <div className="space-y-3">
      <header className="flex items-center gap-2 pt-2">
        <button type="button" onClick={() => setOffset(offset - 1)} className="h-11 w-11 rounded-full text-2xl active:bg-slate-200 dark:active:bg-slate-800" aria-label="Previous day">‹</button>
        <button type="button" onClick={() => setOffset(0)} className="flex-1 text-center">
          <div className="text-xl font-bold">{fmtLong(date)}</div>
          <div className="text-xs text-slate-500">{isToday ? fmtDate(date) : `${fmtDate(date)} · tap for today`}</div>
        </button>
        <button type="button" onClick={() => setOffset(offset + 1)} className="h-11 w-11 rounded-full text-2xl active:bg-slate-200 dark:active:bg-slate-800" aria-label="Next day">›</button>
      </header>

      <Card title={isToday ? "Today's session" : 'Session'}>
        <SessionCard s={session} isToday={isToday} />
      </Card>

      {isToday && (
        <Card title="Weigh-in">
          <QuickWeighIn />
        </Card>
      )}

      <Card title="7-day average" action={<StatusPill status={status} />}>
        <div className="grid grid-cols-2 gap-3">
          <Stat big label="Average" value={avg != null ? avg.toFixed(1) : '—'} sub={avg != null ? fmtStLb(avg) : 'Not enough data'} />
          <Stat big label="Target" value={target != null ? target.toFixed(1) : '—'} sub={target != null ? fmtStLb(target) : 'Outside the plan'} />
        </div>
        {avg != null && target != null && (
          <p className="tabular mt-2 text-sm text-slate-600 dark:text-slate-300">
            {avg - target >= 0 ? `${(avg - target).toFixed(1)} kg above` : `${(target - avg).toFixed(1)} kg below`} target
          </p>
        )}
      </Card>

      <Card title="To go">
        <div className="grid grid-cols-2 gap-3">
          {GOAL.milestones.map((m) => {
            const left = current != null ? current - m.kg : null
            const days = daysBetween(date, m.date)
            return (
              <div key={m.id} className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800/60">
                <div className="text-xs font-medium text-slate-500">{m.label} · {m.kg} kg</div>
                <div className="tabular text-3xl font-bold">{left == null ? '—' : left <= 0 ? '✓' : left.toFixed(1)}<span className="text-base font-semibold"> kg</span></div>
                <div className="tabular text-xs text-slate-500">
                  {left != null && left > 0 ? `${fmtStLb(left)} · ` : ''}
                  {days >= 0 ? `${days} days to ${fmtDate(m.date).slice(0, -5)}` : 'date passed'}
                </div>
              </div>
            )
          })}
        </div>
        <p className="mt-2 text-xs text-slate-500">From the {avg != null ? '7-day average' : 'latest weigh-in'}.</p>
      </Card>

      {warnings.length > 0 && (
        <Card className="border border-amber-300 dark:border-amber-700">
          <div className="font-semibold text-amber-800 dark:text-amber-300">⚠️ {WARNING_TEXT}</div>
          <p className="text-sm">Top set dropped two sessions in a row: {warnings.map((id) => EXERCISES[id].name).join(', ')}.</p>
        </Card>
      )}

      <Card title={isToday ? "Today's habits" : 'Habits'}>
        <HabitForm date={date} settings={settings} />
      </Card>
    </div>
  )
}
