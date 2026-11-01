import { DAILY, type ISODate } from '../plan'
import type { HabitDay, Settings } from '../db/types'
import { addDays, weekStart } from './dates'
import { sessionFor, stepsTarget } from './schedule'

export type HabitKey = 'kcal' | 'protein' | 'steps' | 'water' | 'sleep' | 'session' | 'creatine'

export interface HabitCheck {
  key: HabitKey
  label: string
  target: string
  met: boolean
  applicable: boolean
}

/** Which habits were met on a given day. "Session done" only counts on training days. */
export function habitChecks(day: HabitDay | undefined, date: ISODate, s: Pick<Settings, 'kcalTarget' | 'proteinMin' | 'stepsExtra' | 'waterMinL' | 'sleepMinH' | 'footballPausedForHolidays'>): HabitCheck[] {
  const d = day ?? { date }
  const steps = stepsTarget(date, s.stepsExtra)
  const training = sessionFor(date, { footballPaused: s.footballPausedForHolidays }).kind !== 'rest'
  return [
    { key: 'kcal', label: 'Calories', target: `${DAILY.kcalFloor.toLocaleString('en-GB')}–${s.kcalTarget.toLocaleString('en-GB')} kcal`, met: d.kcal != null && d.kcal >= DAILY.kcalFloor && d.kcal <= s.kcalTarget, applicable: true },
    { key: 'protein', label: 'Protein', target: `${s.proteinMin}+ g`, met: d.protein != null && d.protein >= s.proteinMin, applicable: true },
    { key: 'steps', label: 'Steps', target: steps.toLocaleString('en-GB'), met: d.steps != null && d.steps >= steps, applicable: true },
    { key: 'water', label: 'Water', target: `${s.waterMinL}+ L`, met: d.waterL != null && d.waterL >= s.waterMinL, applicable: true },
    { key: 'sleep', label: 'Sleep', target: `${s.sleepMinH}+ h`, met: d.sleepH != null && d.sleepH >= s.sleepMinH, applicable: true },
    { key: 'session', label: 'Session done', target: training ? 'Training day' : 'Rest day', met: !!d.sessionDone, applicable: training },
    { key: 'creatine', label: 'Creatine', target: 'Daily', met: !!d.creatine, applicable: true },
  ]
}

/** Weekly adherence (Mon–Sun containing `date`, from `from` up to and including `upTo`): % of applicable habit targets met. */
export function weeklyAdherence(days: HabitDay[], date: ISODate, s: Parameters<typeof habitChecks>[2], upTo: ISODate = date, from?: ISODate): { pct: number | null; met: number; total: number } {
  const start = weekStart(date)
  const byDate = new Map(days.map((d) => [d.date, d]))
  let met = 0
  let total = 0
  for (let i = 0; i < 7; i++) {
    const dt = addDays(start, i)
    if (dt > upTo) break
    if (from && dt < from) continue
    for (const c of habitChecks(byDate.get(dt), dt, s)) {
      if (!c.applicable) continue
      total++
      if (c.met) met++
    }
  }
  return { pct: total ? Math.round((met / total) * 100) : null, met, total }
}
