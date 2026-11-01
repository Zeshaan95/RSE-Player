import { DAILY, RULES, type ISODate } from '../plan'
import { addDays, isSunday } from './dates'

export type AdviceBand = 'good' | 'slow' | 'stalled' | 'fast-lifts-down' | 'other'

export type AdviceAction =
  | { type: 'addSteps'; steps: number }
  | { type: 'cutKcal'; kcal: number }
  | { type: 'addCarbs'; kcal: number }
  | { type: 'foodAudit' }

export interface Advice {
  band: AdviceBand | 'none'
  rate: number | null
  headline: string
  details: string[]
  actions: AdviceAction[]
}

export function bandFor(rate: number, liftsDown: boolean): AdviceBand {
  const r = Math.round(rate * 100) / 100
  const b = RULES.rateBands
  if (r >= b.goodMin && r <= b.goodMax) return 'good'
  if (r >= b.slowMin && r < b.goodMin) return 'slow'
  if (r < b.slowMin) return 'stalled'
  if (r > b.fastOver && liftsDown) return 'fast-lifts-down'
  return 'other'
}

const NO_EXTRA_SESSION = 'Never add a sixth hard session: add steps instead.'

/**
 * Rule 3 adjustment advice for a Sunday review (from 15 Nov 2026).
 * @param rate          this Sunday's weekly loss rate (kg/week), or null
 * @param prevRate      last Sunday's rate (for the "still in this band" escalation)
 * @param liftsDown     whether lifts are going down
 * @param kcalTarget    current daily calorie target (cuts never go below the floor)
 */
export function adjustmentAdvice(args: {
  date: ISODate
  rate: number | null
  prevRate: number | null
  liftsDown: boolean
  prevLiftsDown?: boolean
  kcalTarget: number
}): Advice {
  const { date, rate, prevRate, liftsDown, kcalTarget } = args
  if (!isSunday(date) || date < RULES.adviceFrom) {
    return { band: 'none', rate, headline: `Adjustment advice starts on the Sunday review from 15 Nov 2026`, details: [], actions: [] }
  }
  if (rate == null) {
    return { band: 'none', rate, headline: 'Not enough data to work out the weekly loss rate', details: ['Needs at least 3 weigh-ins in the 7 days ending today and in the 7 days ending 14 days ago.'], actions: [] }
  }

  const band = bandFor(rate, liftsDown)
  const kcalCut = Math.min(RULES.kcalCut, Math.max(0, kcalTarget - DAILY.kcalFloor))
  const cutDetail =
    kcalCut > 0
      ? `Cut ${kcalCut} kcal a day from carbs or fat (new target ${kcalTarget - kcalCut} kcal). Never cut protein.`
      : `Calories are already at the ${DAILY.kcalFloor.toLocaleString('en-GB')} kcal floor, so don't cut further. Never cut protein.`
  const cutActions: AdviceAction[] = kcalCut > 0 ? [{ type: 'cutKcal', kcal: kcalCut }] : []

  switch (band) {
    case 'good':
      return { band, rate, headline: 'Change nothing', details: ['Loss rate is in the 0.9–1.4 kg/week sweet spot.'], actions: [] }
    case 'slow': {
      const prevSlow = prevRate != null && bandFor(prevRate, args.prevLiftsDown ?? false) === 'slow'
      if (prevSlow) {
        return {
          band,
          rate,
          headline: `Still slow for a second Sunday: cut ${kcalCut || 0} kcal from carbs or fat`,
          details: [`Keep the extra ${RULES.stepsAdd.toLocaleString('en-GB')} steps a day.`, cutDetail, NO_EXTRA_SESSION],
          actions: cutActions,
        }
      }
      return {
        band,
        rate,
        headline: `Add ${RULES.stepsAdd.toLocaleString('en-GB')} steps a day`,
        details: [`If the rate is still 0.5–0.9 kg/week next Sunday, cut ${RULES.kcalCut} kcal from carbs or fat.`, NO_EXTRA_SESSION],
        actions: [{ type: 'addSteps', steps: RULES.stepsAdd }],
      }
    }
    case 'stalled':
      return {
        band,
        rate,
        headline: 'Run a 3-day weigh-and-log food audit, then make both changes',
        details: [
          'Weigh and log everything for 3 days to find hidden calories (oil, ghee, drinks, snacks).',
          `Then add ${RULES.stepsAdd.toLocaleString('en-GB')} steps a day.`,
          cutDetail,
          NO_EXTRA_SESSION,
        ],
        actions: [{ type: 'foodAudit' }, { type: 'addSteps', steps: RULES.stepsAdd }, ...cutActions],
      }
    case 'fast-lifts-down':
      return {
        band,
        rate,
        headline: `Add ${RULES.kcalAddCarbs} kcal of carbs around training`,
        details: ['Losing faster than 1.5 kg/week and lifts are going down.'],
        actions: [{ type: 'addCarbs', kcal: RULES.kcalAddCarbs }],
      }
    default:
      return { band, rate, headline: 'Change nothing', details: [], actions: [] }
  }
}

/** The previous Sunday (7 days earlier). */
export function previousSunday(date: ISODate): ISODate {
  return addDays(date, -7)
}
