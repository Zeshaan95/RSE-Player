import { describe, expect, it } from 'vitest'
import { SEED } from '../plan'
import type { Workout, WeighIn } from '../db/types'
import { addDays, fmtDate, fmtDateDay, weekday, weekStart } from './dates'
import { fmtStLb, kgToLb, kgToStLb, kgToStones, stonesLbToKg } from './units'
import { dailyReadings, dec6Check, projection, sevenDayAvg, statusFor, targetFor, weeklyLossRate } from './weight'
import { adjustmentAdvice, bandFor } from './advice'
import { best1RM, epley1RM, latestMaxes, liftsGoingDown, newWorkout, progression, repTarget, strengthWarning, strengthWarnings, topSetKg } from './strength'
import { EXERCISES } from '../plan'
import { habitChecks, weeklyAdherence } from './habits'
import { isWaistSunday, jogMinutes, sessionFor, stepsTarget } from './schedule'

const w = (date: string, kg: number, time = '07:00'): WeighIn => ({ date, kg, time })
const seed = SEED.weighIns.map((s) => w(s.date, s.kg))

/** Readings every day from `from` for `n` days, starting at `start`, changing `perDay`. */
function series(from: string, n: number, start: number, perDay: number): WeighIn[] {
  return Array.from({ length: n }, (_, i) => w(addDays(from, i), start + perDay * i))
}

describe('dates', () => {
  it('formats UK dates', () => {
    expect(fmtDate('2026-10-31')).toBe('31 Oct 2026')
    expect(fmtDateDay('2027-01-01')).toBe('Fri 1 Jan 2027')
  })
  it('knows the weekdays in the plan', () => {
    expect(weekday('2026-11-01')).toBe(0)
    expect(weekday('2026-11-22')).toBe(0)
    expect(weekday('2026-12-27')).toBe(0)
    expect(weekday('2027-01-31')).toBe(0)
    expect(weekday('2026-12-19')).toBe(6)
  })
  it('handles the BST change (25 Oct 2026)', () => {
    expect(addDays('2026-10-24', 2)).toBe('2026-10-26')
    expect(weekStart('2026-11-01')).toBe('2026-10-26')
  })
})

describe('stone/kg conversion', () => {
  it('converts with the plan constants', () => {
    expect(kgToStones(6.35029)).toBeCloseTo(1, 6)
    expect(kgToLb(1)).toBeCloseTo(2.20462, 6)
    expect(stonesLbToKg(15, 1)).toBeCloseTo(211 / 2.20462, 2)
  })
  it('shows the start weight as 15 st 1 lb', () => {
    expect(fmtStLb(95.75)).toBe('15 st 1 lb')
    expect(kgToStLb(95.75)).toEqual({ st: 15, lb: 1, negative: false })
  })
  it('shows the milestones as 1.5 st and 2 st down from the start', () => {
    expect(kgToStones(95.75 - 86.2)).toBeCloseTo(1.5, 1)
    expect(kgToStones(95.75 - 83.0)).toBeCloseTo(2.0, 1)
  })
  it('carries 14 lb into a stone', () => {
    // 13.99 lb rounds up to 14 → next stone
    expect(fmtStLb(stonesLbToKg(14, 13.8))).toBe('15 st 0 lb')
  })
})

describe('rule 1: 7-day average', () => {
  const daily = dailyReadings(seed)
  it('matches the reset point on 31 Oct (≈96.7)', () => {
    const avg = sevenDayAvg(daily, '2026-10-31')!
    expect(avg).toBeCloseTo((96.95 + 96.95 + 96.5 + 96.35) / 4, 6)
    expect(Math.round(avg * 10) / 10).toBe(96.7)
  })
  it('needs at least 3 readings', () => {
    expect(sevenDayAvg(daily, '2026-10-20')).toBeNull()
    expect(sevenDayAvg(daily, '2026-10-28')).toBeNull() // 2 readings
    expect(sevenDayAvg(daily, '2026-10-29')).toBeCloseTo((96.95 + 96.95 + 96.5) / 3, 6)
  })
  it('window is the 7 days ending that day (inclusive)', () => {
    // 2 Nov window = 27 Oct..2 Nov → 4 readings; 3 Nov → 28 Oct..3 Nov → 3 readings
    expect(sevenDayAvg(daily, '2026-11-02')).toBeCloseTo((96.95 + 96.95 + 96.5 + 96.35) / 4, 6)
    expect(sevenDayAvg(daily, '2026-11-03')).toBeCloseTo((96.95 + 96.5 + 96.35) / 3, 6)
    expect(sevenDayAvg(daily, '2026-11-05')).toBeNull()
  })
  it('uses the earliest reading of the day', () => {
    const d = dailyReadings([w('2026-11-01', 97, '21:00'), w('2026-11-01', 96, '06:30'), w('2026-11-01', 98, '12:00')])
    expect(d.get('2026-11-01')).toBe(96)
  })
})

describe('target path interpolation', () => {
  it('hits every point exactly', () => {
    expect(targetFor('2026-10-31')).toBeCloseTo(96.7)
    expect(targetFor('2026-11-08')).toBeCloseTo(94.7)
    expect(targetFor('2026-12-06')).toBeCloseTo(90.3)
    expect(targetFor('2027-01-01')).toBeCloseTo(86.2)
    expect(targetFor('2027-01-31')).toBeCloseTo(83.0)
  })
  it('interpolates linearly between points', () => {
    expect(targetFor('2026-11-04')).toBeCloseTo(95.7) // halfway 31 Oct → 8 Nov
    expect(targetFor('2026-12-29')).toBeCloseTo(87.0 - (0.8 * 2) / 5) // 27 Dec → 1 Jan (5 days)
  })
  it('is null outside the plan', () => {
    expect(targetFor('2026-10-30')).toBeNull()
    expect(targetFor('2027-02-01')).toBeNull()
  })
})

describe('rule 2: status', () => {
  it('uses a ±0.5 kg band', () => {
    expect(statusFor(90.8, 90.3)).toBe('on-track')
    expect(statusFor(89.8, 90.3)).toBe('on-track')
    expect(statusFor(90.81, 90.3)).toBe('behind')
    expect(statusFor(89.79, 90.3)).toBe('ahead')
    expect(statusFor(null, 90)).toBeNull()
    expect(statusFor(90, null)).toBeNull()
  })
})

describe('rule 3: loss rate and adjustment advice', () => {
  it('rate = (avg 14 days ago − avg today) ÷ 2', () => {
    const d = dailyReadings(series('2026-11-01', 30, 96, -0.15)) // 1.05 kg/week
    expect(weeklyLossRate(d, '2026-11-22')).toBeCloseTo(1.05, 6)
  })
  it('rate is null without enough data', () => {
    expect(weeklyLossRate(dailyReadings(seed), '2026-11-15')).toBeNull()
  })
  it('bands', () => {
    expect(bandFor(0.9, false)).toBe('good')
    expect(bandFor(1.4, false)).toBe('good')
    expect(bandFor(0.5, false)).toBe('slow')
    expect(bandFor(0.89, false)).toBe('slow')
    expect(bandFor(0.49, false)).toBe('stalled')
    expect(bandFor(-0.3, false)).toBe('stalled')
    expect(bandFor(1.45, true)).toBe('other')
    expect(bandFor(1.6, false)).toBe('other')
    expect(bandFor(1.6, true)).toBe('fast-lifts-down')
  })
  const base = { date: '2026-11-22', liftsDown: false, kcalTarget: 1900, prevRate: null }
  it('does nothing before 15 Nov or on non-Sundays', () => {
    expect(adjustmentAdvice({ ...base, date: '2026-11-08', rate: 0.2 }).actions).toEqual([])
    expect(adjustmentAdvice({ ...base, date: '2026-11-21', rate: 0.2 }).band).toBe('none')
  })
  it('0.9–1.4: change nothing', () => {
    const a = adjustmentAdvice({ ...base, rate: 1.1 })
    expect(a.headline).toBe('Change nothing')
    expect(a.actions).toEqual([])
  })
  it('0.5–0.9: add 2,000 steps, then cut 150 kcal the following Sunday', () => {
    const first = adjustmentAdvice({ ...base, rate: 0.7 })
    expect(first.actions).toEqual([{ type: 'addSteps', steps: 2000 }])
    const second = adjustmentAdvice({ ...base, rate: 0.7, prevRate: 0.6 })
    expect(second.actions).toEqual([{ type: 'cutKcal', kcal: 150 }])
  })
  it('never goes below 1,750 kcal', () => {
    const a = adjustmentAdvice({ ...base, rate: 0.7, prevRate: 0.6, kcalTarget: 1750 })
    expect(a.actions).toEqual([])
    expect(a.details.join(' ')).toMatch(/1,750 kcal floor/)
    const b = adjustmentAdvice({ ...base, rate: 0.7, prevRate: 0.6, kcalTarget: 1800 })
    expect(b.actions).toEqual([{ type: 'cutKcal', kcal: 50 }])
  })
  it('under 0.5: food audit then both changes', () => {
    const a = adjustmentAdvice({ ...base, rate: 0.3 })
    expect(a.actions).toEqual([{ type: 'foodAudit' }, { type: 'addSteps', steps: 2000 }, { type: 'cutKcal', kcal: 150 }])
  })
  it('over 1.5 with lifts going down: add 150 kcal carbs', () => {
    expect(adjustmentAdvice({ ...base, rate: 1.7, liftsDown: true }).actions).toEqual([{ type: 'addCarbs', kcal: 150 }])
    expect(adjustmentAdvice({ ...base, rate: 1.7, liftsDown: false }).actions).toEqual([])
  })
  it('never suggests an extra hard session', () => {
    for (const rate of [0.1, 0.6, 1.0, 1.45, 2]) {
      const a = adjustmentAdvice({ ...base, rate, prevRate: 0.6 })
      expect(a.actions.every((x) => ['addSteps', 'cutKcal', 'addCarbs', 'foodAudit'].includes(x.type))).toBe(true)
      for (const line of [a.headline, ...a.details]) if (/session/i.test(line)) expect(line).toMatch(/^Never add a sixth hard session/)
    }
  })
})

describe('rule 4: 6 Dec check', () => {
  it('flags > 2 kg behind and pushes the 2-stone date back at plan pace', () => {
    // 7-day avg on 6 Dec = 93.0 (2.7 above 90.3)
    const d = dailyReadings(series('2026-11-30', 7, 93.0, 0))
    const r = dec6Check(d)!
    expect(r.behind).toBe(true)
    expect(r.gapKg).toBeCloseTo(2.7)
    expect(r.pacePerWeek).toBeCloseTo((90.3 - 83.0) / 8)
    // (93 − 83) / 0.9125 = 10.96 weeks → 77 days after 6 Dec
    expect(r.newTwoStoneDate).toBe(addDays('2026-12-06', Math.ceil((10 / ((90.3 - 83) / 8)) * 7)))
    expect(r.newTwoStoneDate > '2027-01-31').toBe(true)
  })
  it('is not behind within 2 kg', () => {
    const d = dailyReadings(series('2026-11-30', 7, 92.3, 0))
    expect(dec6Check(d)!.behind).toBe(false)
  })
  it('null without data', () => {
    expect(dec6Check(dailyReadings(seed))).toBeNull()
  })
})

describe('rule 5: progression', () => {
  const squat = EXERCISES.backSquat
  const log = (reps: number[], kg = 80) => ({ exerciseId: 'backSquat', sets: reps.map((r) => ({ kg, reps: r })) })
  it('suggests +2.5 kg when every working set hits the top of the range', () => {
    expect(progression(squat, 'A', log([8, 8, 8]))?.addKg).toBe(2.5)
  })
  it('no badge if any set falls short, or sets missing', () => {
    expect(progression(squat, 'A', log([8, 8, 7]))).toBeNull()
    expect(progression(squat, 'A', log([8, 8]))).toBeNull()
  })
  it('ignores warm-up sets', () => {
    const l = { exerciseId: 'backSquat', sets: [{ kg: 40, reps: 5, warmup: true }, ...log([8, 8, 8]).sets] }
    expect(progression(squat, 'A', l)).not.toBeNull()
  })
  it('suggests next dumbbell for dumbbell lifts', () => {
    const l = { exerciseId: 'dbBench', sets: [10, 10, 10].map((r) => ({ kg: 30, reps: r })) }
    expect(progression(EXERCISES.dbBench, 'B', l)?.message).toMatch(/next dumbbell/)
  })
  it('max-minus-one = latest tested max − 1', () => {
    const maxes = latestMaxes([{ date: '2026-11-22', test: 'pullup', reps: 9 }], { pullup: 7, dips: null })
    expect(repTarget(EXERCISES.pullup, maxes)).toEqual({ min: 8, max: 8 })
    expect(repTarget(EXERCISES.pullup, { pullup: 7, dips: null })).toEqual({ min: 6, max: 6 })
    expect(repTarget(EXERCISES.dips, { pullup: 7, dips: null })).toBeNull()
    expect(progression(EXERCISES.pullup, 'B', { exerciseId: 'pullup', sets: [6, 6, 6, 6].map((r) => ({ kg: null, reps: r })) })).toBeNull()
  })
  it('pull-ups get 3 sets in Strength C and 4 in B', () => {
    const c = newWorkout('C', '2026-11-03', [], 'x')
    const b = newWorkout('B', '2026-11-01', [], 'x')
    expect(c.exercises.find((e) => e.exerciseId === 'pullup')!.sets).toHaveLength(3)
    expect(b.exercises.find((e) => e.exerciseId === 'pullup')!.sets).toHaveLength(4)
  })
})

describe('rule 6: strength warning and 1RM', () => {
  it('flags two drops in a row only', () => {
    expect(strengthWarning([100, 97.5, 95])).toBe(true)
    expect(strengthWarning([100, 97.5, 97.5])).toBe(false)
    expect(strengthWarning([100, 97.5, 100])).toBe(false)
    expect(strengthWarning([97.5, 95])).toBe(false)
    expect(strengthWarning([110, 100, 97.5, 95])).toBe(true)
  })
  const wk = (date: string, kg: number, id: number): Workout => ({
    id, date, template: 'A', completed: true, startedAt: date,
    exercises: [{ exerciseId: 'backSquat', sets: [{ kg: 40, reps: 5, warmup: true }, { kg, reps: 6 }, { kg: kg - 5, reps: 8 }] }],
  })
  it('works on logged sessions using top working sets', () => {
    const ws = [wk('2026-11-07', 80, 1), wk('2026-11-14', 77.5, 2), wk('2026-11-21', 75, 3)]
    expect(topSetKg(ws[0].exercises[0])).toBe(80)
    expect(strengthWarnings(ws)).toEqual(['backSquat'])
    expect(liftsGoingDown(ws, '2026-11-22')).toBe(true)
    expect(liftsGoingDown([wk('2026-11-14', 77.5, 2), wk('2026-11-21', 80, 3)], '2026-11-22')).toBe(false)
  })
  it('Epley 1RM', () => {
    expect(epley1RM(100, 5)).toBeCloseTo(116.667, 2)
    expect(epley1RM(100, 1)).toBe(100)
    expect(best1RM({ exerciseId: 'x', sets: [{ kg: 100, reps: 5 }, { kg: 90, reps: 10 }] })).toBeCloseTo(120, 6)
  })
})

describe('rule 7: projection', () => {
  it('projects milestone dates from the 14-day trend', () => {
    // Losing exactly 0.15 kg/day, 94.0 on 1 Dec … 92.05 on 14 Dec
    const d = dailyReadings(series('2026-12-01', 14, 94.0, -0.15))
    const p = projection(d, '2026-12-14')!
    expect(p.slopeKgPerWeek).toBeCloseTo(-1.05, 6)
    // fitted today = 92.05; 86.2 needs 5.85/0.15 = 39 days
    expect(p.dates.m1).toBe(addDays('2026-12-14', 39))
    expect(p.dates.m2).toBe(addDays('2026-12-14', Math.ceil((92.05 - 83.0) / 0.15)))
  })
  it('returns no dates when not losing', () => {
    const p = projection(dailyReadings(series('2026-12-01', 14, 94.0, 0.05)), '2026-12-14')!
    expect(p.dates.m1).toBeNull()
  })
  it('only uses the last 14 days', () => {
    const old = series('2026-11-01', 10, 99, 0) // ignored
    const recent = series('2026-12-01', 14, 94.0, -0.15)
    const p = projection(dailyReadings([...old, ...recent]), '2026-12-14')!
    expect(p.readings).toBe(14)
  })
  it('needs 3 readings', () => {
    expect(projection(dailyReadings(seed), '2026-11-12')).toBeNull()
  })
})

describe('schedule', () => {
  it('weekly sessions', () => {
    expect(sessionFor('2026-11-02').kind).toBe('jog') // Mon
    expect(sessionFor('2026-11-03').template).toBe('C') // Tue
    expect(sessionFor('2026-11-04').kind).toBe('rest') // Wed
    expect(sessionFor('2026-11-05').kind).toBe('football') // Thu
    expect(sessionFor('2026-11-06').kind).toBe('rest') // Fri
    expect(sessionFor('2026-11-07').template).toBe('A') // Sat
    expect(sessionFor('2026-11-08').template).toBe('B') // Sun
    expect(sessionFor('2026-11-08').weeklyReview).toBe(true)
  })
  it('pull-up test days', () => {
    expect(sessionFor('2026-11-22').pullupTest).toBe(true)
    expect(sessionFor('2026-12-27').pullupTest).toBe(true)
    expect(sessionFor('2026-11-29').pullupTest).toBe(false)
  })
  it('festive fortnight moves weekday sessions, not weekends', () => {
    expect(sessionFor('2026-12-22').when).toBe('10:00–11:30') // Tue
    expect(sessionFor('2026-12-21').when).toBe('10:00–11:30') // Mon jog
    expect(sessionFor('2026-12-19').when).toBe('Morning, 08:00–10:00') // Sat
    expect(sessionFor('2026-12-15').when).toBe('Straight after school')
    expect(sessionFor('2027-01-01').festive).toBe(true)
    expect(sessionFor('2027-01-02').festive).toBe(false)
  })
  it('football replacement when paused over the holidays', () => {
    expect(sessionFor('2026-12-24').kind).toBe('football')
    const s = sessionFor('2026-12-24', { footballPaused: true })
    expect(s.title).toBe('40-min jog or incline walk')
    expect(s.when).toBe('10:00–11:30')
    // Not applied outside the fortnight
    expect(sessionFor('2026-12-17', { footballPaused: true }).kind).toBe('football')
  })
  it('never more than 2 runs a week', () => {
    for (let i = 0; i < 13 * 7; i += 7) {
      const mon = addDays('2026-11-02', i)
      const runs = Array.from({ length: 7 }, (_, k) => sessionFor(addDays(mon, k), { footballPaused: true })).filter((s) => s.kind === 'jog').length
      expect(runs).toBeLessThanOrEqual(2)
    }
  })
  it('jog progression: +5 min per fortnight, capped at 35–40', () => {
    expect(jogMinutes('2026-11-02')).toEqual({ min: 20, max: 25 })
    expect(jogMinutes('2026-11-16')).toEqual({ min: 25, max: 30 })
    expect(jogMinutes('2026-11-30')).toEqual({ min: 30, max: 35 })
    expect(jogMinutes('2026-12-14')).toEqual({ min: 35, max: 40 })
    expect(jogMinutes('2027-01-25')).toEqual({ min: 35, max: 40 })
  })
  it('steps: 10,000 until 8 Nov, then 12,000', () => {
    expect(stepsTarget('2026-11-08')).toBe(10000)
    expect(stepsTarget('2026-11-09')).toBe(12000)
    expect(stepsTarget('2026-11-09', 2000)).toBe(14000)
  })
  it('waist every other Sunday from 1 Nov', () => {
    expect(isWaistSunday('2026-11-01')).toBe(true)
    expect(isWaistSunday('2026-11-08')).toBe(false)
    expect(isWaistSunday('2026-11-15')).toBe(true)
    expect(isWaistSunday('2026-11-16')).toBe(false)
  })
  it('every date 31 Oct – 31 Jan has a session', () => {
    for (let d = '2026-10-31'; d <= '2027-01-31'; d = addDays(d, 1)) {
      expect(sessionFor(d).title.length).toBeGreaterThan(0)
    }
  })
})

describe('habits', () => {
  const s = { kcalTarget: 1900, proteinMin: 160, stepsExtra: 0, waterMinL: 2.5, sleepMinH: 7, footballPausedForHolidays: false }
  it('checks each habit against target', () => {
    const c = habitChecks({ date: '2026-11-03', kcal: 1700, protein: 165, steps: 10000, waterL: 2.5, sleepH: 6.5, sessionDone: true, creatine: true }, '2026-11-03', s)
    expect(Object.fromEntries(c.map((x) => [x.key, x.met]))).toEqual({ kcal: false, protein: true, steps: true, water: true, sleep: false, session: true, creatine: true })
  })
  it('session only counts on training days', () => {
    expect(habitChecks(undefined, '2026-11-04', s).find((c) => c.key === 'session')!.applicable).toBe(false)
  })
  it('weekly adherence %', () => {
    const full = { kcal: 1850, protein: 170, steps: 13000, waterL: 3, sleepH: 7.5, sessionDone: true, creatine: true }
    // Mon 2 Nov (training: 7 habits) all met; Tue 3 Nov nothing
    const r = weeklyAdherence([{ date: '2026-11-02', ...full }], '2026-11-03', s)
    expect(r).toEqual({ pct: 50, met: 7, total: 14 })
    // Days before `from` are ignored
    expect(weeklyAdherence([{ date: '2026-11-02', ...full }], '2026-11-03', s, '2026-11-03', '2026-11-03').total).toBe(7)
  })
})
