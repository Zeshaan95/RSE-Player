import { useLiveQuery } from 'dexie-react-hooks'
import { useState } from 'react'
import { db } from '../db/db'
import { useSettings, useToday } from '../hooks'
import { addDays, fmtDate, fmtLong, weekStart } from '../lib/dates'
import { habitChecks, weeklyAdherence } from '../lib/habits'
import { DAILY } from '../plan'
import { Card, PageHeader } from '../components/ui'
import { HabitForm } from '../components/HabitForm'

const DAY_LETTERS = ['M', 'T', 'W', 'T', 'F', 'S', 'S']

export default function Habits() {
  const today = useToday()
  const [date, setDate] = useState(today)
  const settings = useSettings()
  const days = useLiveQuery(() => db.habits.toArray(), []) ?? []
  const start = weekStart(date)
  const adh = weeklyAdherence(days, date, settings, date < weekStart(today) ? addDays(start, 6) : today, settings.seededAt.slice(0, 10))
  const byDate = new Map(days.map((d) => [d.date, d]))

  return (
    <div className="space-y-3">
      <PageHeader title="Daily habits" />
      <Card title={`Week of ${fmtDate(start)}`}>
        <div className="flex items-end justify-between">
          <div>
            <div className="text-xs text-slate-500">Weekly adherence</div>
            <div className="tabular text-5xl font-bold">{adh.pct == null ? '—' : `${adh.pct}%`}</div>
            <div className="tabular text-xs text-slate-500">{adh.met} of {adh.total} targets met so far</div>
          </div>
        </div>
        <div className="mt-3 grid grid-cols-7 gap-1">
          {DAY_LETTERS.map((l, i) => {
            const d = addDays(start, i)
            const checks = habitChecks(byDate.get(d), d, settings).filter((c) => c.applicable)
            const met = checks.filter((c) => c.met).length
            const future = d > today
            return (
              <button key={d} type="button" onClick={() => !future && setDate(d)} disabled={future} className={`flex h-16 flex-col items-center justify-center rounded-xl text-xs ${d === date ? 'ring-2 ring-brand-600' : ''} ${future ? 'opacity-30' : 'bg-slate-50 dark:bg-slate-800/60'}`}>
                <span className="font-semibold text-slate-500">{l}</span>
                <span className="tabular text-base font-bold">{future ? '' : `${met}/${checks.length}`}</span>
              </button>
            )
          })}
        </div>
        <div className="mt-2 flex justify-between">
          <button type="button" className="min-h-11 px-2 text-brand-700 dark:text-brand-500" onClick={() => setDate(addDays(start, -7))}>‹ Previous week</button>
          {start < weekStart(today) && <button type="button" className="min-h-11 px-2 text-brand-700 dark:text-brand-500" onClick={() => setDate(today)}>This week ›</button>}
        </div>
      </Card>
      <Card title={fmtLong(date)}>
        <HabitForm date={date} settings={settings} />
      </Card>
      <Card title="Other daily targets">
        <ul className="tabular grid grid-cols-2 gap-2 text-sm">
          <li>Protein: {settings.proteinMin}–{settings.proteinMax} g (≈{DAILY.proteinPerMeal} g × {DAILY.meals} meals)</li>
          <li>Fat: ≈{settings.fatG} g</li>
          <li>Carbs: ≈{settings.carbsG} g, mostly around training</li>
          <li>Fibre: {settings.fibreMinG}+ g</li>
          <li>Water: {DAILY.waterMinL}–{DAILY.waterMaxL} L</li>
          <li>Sleep: {DAILY.sleepMinH}–{DAILY.sleepMaxH} h</li>
          <li className="col-span-2">Creatine: {DAILY.creatine.toLowerCase()}</li>
        </ul>
      </Card>
    </div>
  )
}
