import { GOAL, RULES, TARGET_PATH, type ISODate } from '../plan'
import { addDays, dayNum, daysBetween, fromDayNum } from './dates'
import type { WeighIn } from '../db/types'

/** Rule 1 helper: one reading per day — the earliest by time. */
export function dailyReadings(weighIns: WeighIn[]): Map<ISODate, number> {
  const best = new Map<ISODate, WeighIn>()
  for (const w of weighIns) {
    const cur = best.get(w.date)
    if (!cur || w.time < cur.time) best.set(w.date, w)
  }
  const out = new Map<ISODate, number>()
  for (const [d, w] of [...best.entries()].sort(([a], [b]) => (a < b ? -1 : 1))) out.set(d, w.kg)
  return out
}

/**
 * Rule 1: mean of the daily (earliest) readings in the 7 days ending on `date`.
 * Returns null ("not enough data") with fewer than 3 readings.
 */
export function sevenDayAvg(daily: Map<ISODate, number>, date: ISODate): number | null {
  const from = addDays(date, -(RULES.avgWindowDays - 1))
  const vals: number[] = []
  for (const [d, kg] of daily) if (d >= from && d <= date) vals.push(kg)
  if (vals.length < RULES.avgMinReadings) return null
  return vals.reduce((a, b) => a + b, 0) / vals.length
}

/** Target 7-day average for any date, linearly interpolated. Null outside the path. */
export function targetFor(date: ISODate): number | null {
  const first = TARGET_PATH[0]
  const last = TARGET_PATH[TARGET_PATH.length - 1]
  if (date < first.date || date > last.date) return null
  for (let i = 0; i < TARGET_PATH.length - 1; i++) {
    const a = TARGET_PATH[i]
    const b = TARGET_PATH[i + 1]
    if (date >= a.date && date <= b.date) {
      const span = daysBetween(a.date, b.date)
      const t = daysBetween(a.date, date) / span
      return a.kg + (b.kg - a.kg) * t
    }
  }
  return null
}

export type Status = 'on-track' | 'behind' | 'ahead'

/** Rule 2: compare the 7-day average with the day's target (±0.5 kg band). */
export function statusFor(avg: number | null, target: number | null): Status | null {
  if (avg == null || target == null) return null
  const diff = avg - target
  // Round to 0.01 kg so float noise never flips a boundary case.
  const d = Math.round(diff * 100) / 100
  if (d > RULES.statusBandKg) return 'behind'
  if (d < -RULES.statusBandKg) return 'ahead'
  return 'on-track'
}

export const STATUS_LABEL: Record<Status, string> = {
  'on-track': 'On track',
  behind: 'Behind',
  ahead: 'Ahead',
}

/** Rule 3: weekly loss rate = (avg 14 days ago − avg today) ÷ 2. Positive = losing. */
export function weeklyLossRate(daily: Map<ISODate, number>, date: ISODate): number | null {
  const now = sevenDayAvg(daily, date)
  const then = sevenDayAvg(daily, addDays(date, -RULES.rateLookbackDays))
  if (now == null || then == null) return null
  return (then - now) / (RULES.rateLookbackDays / 7)
}

export interface Projection {
  slopeKgPerWeek: number // negative = losing
  dates: Record<string, ISODate | 'reached' | null> // keyed by milestone id
  readings: number
}

/**
 * Rule 7: least-squares line through the daily readings of the last 14 days
 * (ending on `date`), projected forward to each milestone weight.
 * Null if fewer than 3 readings. A milestone date is null if the trend isn't downwards.
 */
export function projection(daily: Map<ISODate, number>, date: ISODate): Projection | null {
  const from = addDays(date, -(RULES.projectionWindowDays - 1))
  const pts: Array<[number, number]> = []
  for (const [d, kg] of daily) if (d >= from && d <= date) pts.push([dayNum(d), kg])
  if (pts.length < 3) return null
  const n = pts.length
  const mx = pts.reduce((s, p) => s + p[0], 0) / n
  const my = pts.reduce((s, p) => s + p[1], 0) / n
  let sxx = 0
  let sxy = 0
  for (const [x, y] of pts) {
    sxx += (x - mx) ** 2
    sxy += (x - mx) * (y - my)
  }
  if (sxx === 0) return null
  const slope = sxy / sxx // kg per day
  const today = dayNum(date)
  const fittedToday = my + slope * (today - mx)
  const dates: Projection['dates'] = {}
  for (const m of GOAL.milestones) {
    if (fittedToday <= m.kg) dates[m.id] = 'reached'
    else if (slope >= 0) dates[m.id] = null
    else dates[m.id] = fromDayNum(today + Math.ceil((m.kg - fittedToday) / slope))
  }
  return { slopeKgPerWeek: slope * 7, dates, readings: n }
}

export interface Dec6Result {
  avg: number
  target: number
  gapKg: number
  behind: boolean
  pacePerWeek: number
  /** Recalculated 2-stone date at the plan's pace (only meaningful when behind). */
  newTwoStoneDate: ISODate
}

/**
 * Rule 4: if the 6 Dec average is more than 2 kg above target, keep the plan's
 * weekly pace (6 Dec → 31 Jan) and push the 2-stone date back accordingly.
 */
export function dec6Check(daily: Map<ISODate, number>): Dec6Result | null {
  const d = RULES.dec6CheckDate
  const avg = sevenDayAvg(daily, d)
  const target = targetFor(d)
  if (avg == null || target == null) return null
  const m2 = GOAL.milestones[1]
  const weeks = daysBetween(d, m2.date) / 7
  const pacePerWeek = (target - m2.kg) / weeks
  const gapKg = avg - target
  const behind = Math.round(gapKg * 100) / 100 > RULES.dec6BehindKg
  const newTwoStoneDate = addDays(d, Math.ceil(((avg - m2.kg) / pacePerWeek) * 7))
  return { avg, target, gapKg, behind, pacePerWeek, newTwoStoneDate }
}
