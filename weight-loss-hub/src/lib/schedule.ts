import { DAILY, FESTIVE, JOG, PULLUP_TEST_DAYS, RULES, WEEKLY_SCHEDULE, type ISODate, type SessionKind, type TemplateId } from '../plan'
import { daysBetween, inRange, isSunday, weekday } from './dates'

export interface SessionForDay {
  title: string
  kind: SessionKind
  template?: TemplateId
  length?: string
  when?: string
  notes: string[]
  festive: boolean
  pullupTest: boolean
  weeklyReview: boolean
}

export function isFestive(date: ISODate): boolean {
  return inRange(date, FESTIVE.start, FESTIVE.end)
}

/** Jog length for a date: 20–25 min, +5 min each fortnight from the reset, capped at 35–40. */
export function jogMinutes(date: ISODate): { min: number; max: number } {
  const fortnights = Math.max(0, Math.floor(daysBetween(JOG.progressionStart, date) / 14))
  const add = fortnights * JOG.stepMinPerFortnight
  return { min: Math.min(JOG.startMin + add, JOG.capMin), max: Math.min(JOG.startMax + add, JOG.capMax) }
}

export function isPullupTestDay(date: ISODate): boolean {
  return PULLUP_TEST_DAYS.includes(date)
}

/** Today's session from the weekly schedule, with test days and the festive fortnight applied. */
export function sessionFor(date: ISODate, opts: { footballPaused?: boolean } = {}): SessionForDay {
  const wd = weekday(date)
  const base = WEEKLY_SCHEDULE[wd]
  const festive = isFestive(date)
  const isWeekday = wd >= 1 && wd <= 5
  const out: SessionForDay = {
    title: base.title,
    kind: base.kind,
    template: base.template,
    length: base.length,
    when: base.when,
    notes: [],
    festive,
    pullupTest: isPullupTestDay(date),
    weeklyReview: isSunday(date),
  }
  if (base.extra) out.notes.push(base.extra)

  if (festive && base.kind === 'football') {
    if (opts.footballPaused) {
      out.title = FESTIVE.footballReplacement.title
      out.kind = FESTIVE.footballReplacement.kind
      out.length = FESTIVE.footballReplacement.length
      out.notes.push('Football is off for the holidays, so this replaces it')
    } else {
      out.notes.push(`If football stops for the holidays: ${FESTIVE.footballReplacement.title} instead`)
    }
  }

  if (festive && isWeekday && base.kind !== 'rest') out.when = FESTIVE.weekdayWhen

  if (out.kind === 'jog' && base.kind === 'jog') {
    const j = jogMinutes(date)
    out.length = `${j.min}–${j.max} min`
    out.notes.push(`Conversational pace, ${JOG.intervalOption}`)
  }

  if (out.pullupTest) out.notes.unshift('Pull-up max test today: do it first, before any other sets, strict reps only')
  if (festive) out.notes.push('Festive fortnight')
  return out
}

/** Steps target for a date (plan base + any rule-3 extra steps from settings). */
export function stepsTarget(date: ISODate, extra = 0): number {
  return (date <= DAILY.stepsSwitchAfter ? DAILY.stepsEarly : DAILY.stepsLater) + extra
}

/** Waist measurement due every other Sunday from 1 Nov 2026. */
export function isWaistSunday(date: ISODate): boolean {
  if (!isSunday(date) || date < RULES.waistFrom) return false
  return daysBetween(RULES.waistFrom, date) % RULES.waistEveryDays === 0
}
