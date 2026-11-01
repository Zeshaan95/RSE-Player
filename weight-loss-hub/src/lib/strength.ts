import { EXERCISES, RULES, SESSION_RULES, TEMPLATES, TEMPLATE_SET_OVERRIDES, type ExerciseDef, type ISODate, type TemplateId } from '../plan'
import type { ExerciseLog, MaxTest, SetEntry, Workout } from '../db/types'
import { addDays } from './dates'

export interface Maxes {
  pullup: number | null
  dips: number | null
}

/** Latest tested max per test type (falls back to the given baselines). */
export function latestMaxes(tests: MaxTest[], baselines: Maxes): Maxes {
  const out: Maxes = { ...baselines }
  const sorted = [...tests].sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : (a.id ?? 0) - (b.id ?? 0)))
  for (const t of sorted) out[t.test] = t.reps
  return out
}

/** Rep target for an exercise. Max-minus-one = latest tested max − 1, per set. */
export function repTarget(ex: ExerciseDef, maxes: Maxes): { min: number; max: number } | null {
  if (ex.reps.type === 'range') return { min: ex.reps.min, max: ex.reps.max }
  const m = maxes[ex.reps.test]
  if (m == null) return null
  const r = Math.max(1, m - 1)
  return { min: r, max: r }
}

export function setsFor(template: TemplateId, exerciseId: string): number {
  return TEMPLATE_SET_OVERRIDES[template]?.[exerciseId] ?? EXERCISES[exerciseId].sets
}

export function restSecondsFor(ex: ExerciseDef): number {
  return ex.compound ? SESSION_RULES.restCompoundSec.default : SESSION_RULES.restAccessorySec.default
}

export function repLabel(ex: ExerciseDef, maxes: Maxes): string {
  if (ex.reps.type === 'maxMinusOne') {
    const m = maxes[ex.reps.test]
    return m == null ? 'max − 1 (log a max test)' : `${Math.max(1, m - 1)} (max ${m} − 1)`
  }
  const { min, max } = ex.reps
  const r = min === max ? `${min}` : `${min}–${max}`
  return ex.perSide ? `${r} each leg` : r
}

export function workingSets(log: ExerciseLog | undefined): SetEntry[] {
  return (log?.sets ?? []).filter((s) => !s.warmup && s.reps != null && s.reps > 0)
}

/** Heaviest working-set load in a session (null if no loaded working sets). */
export function topSetKg(log: ExerciseLog | undefined): number | null {
  const loads = workingSets(log)
    .map((s) => s.kg)
    .filter((k): k is number => k != null)
  return loads.length ? Math.max(...loads) : null
}

/** Epley estimated 1RM: w × (1 + reps/30). A single rep is the weight itself. */
export function epley1RM(kg: number, reps: number): number {
  if (reps <= 1) return kg
  return kg * (1 + reps / 30)
}

export function best1RM(log: ExerciseLog | undefined): number | null {
  const vals = workingSets(log)
    .filter((s) => s.kg != null && s.kg > 0)
    .map((s) => epley1RM(s.kg as number, s.reps as number))
  return vals.length ? Math.max(...vals) : null
}

export interface ProgressionAdvice {
  addKg: number
  message: string
}

/**
 * Rule 5: when every prescribed working set hit the top of the rep range last
 * session, suggest adding 2.5 kg (or the next dumbbell) next session.
 * Max-minus-one moves progress via max tests instead, so they get no badge.
 */
export function progression(ex: ExerciseDef, template: TemplateId, last: ExerciseLog | undefined): ProgressionAdvice | null {
  if (ex.reps.type !== 'range' || !last) return null
  const sets = workingSets(last)
  const needed = setsFor(template, ex.id)
  if (sets.length < needed) return null
  if (!sets.every((s) => (s.reps as number) >= (ex.reps as { max: number }).max)) return null
  const add = SESSION_RULES.progressionKg
  const message = ex.dumbbell
    ? `Add ${add} kg or move to the next dumbbell`
    : ex.bodyweight
      ? `Add ${add} kg (belt or dumbbell)`
      : `Add ${add} kg next session`
  return { addKg: add, message }
}

export interface HistoryPoint {
  date: ISODate
  workoutId?: number
  log: ExerciseLog
}

/** Completed-session history for an exercise, oldest first. */
export function exerciseHistory(workouts: Workout[], exerciseId: string, opts: { before?: ISODate; excludeId?: number } = {}): HistoryPoint[] {
  return workouts
    .filter((w) => w.completed && w.id !== opts.excludeId && (opts.before == null || w.date < opts.before))
    .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : (a.id ?? 0) - (b.id ?? 0)))
    .flatMap((w) => {
      const log = w.exercises.find((e) => e.exerciseId === exerciseId)
      return log && workingSets(log).length ? [{ date: w.date, workoutId: w.id, log }] : []
    })
}

/** Rule 6: top-set load on a compound lift dropped two sessions in a row. */
export function strengthWarning(topSets: Array<number | null>): boolean {
  const t = topSets.filter((x): x is number => x != null)
  if (t.length < 3) return false
  const [a, b, c] = t.slice(-3)
  return b < a && c < b
}

export const WARNING_TEXT = 'Check food and sleep'

/** Compound lifts flagged by rule 6, given all workouts. */
export function strengthWarnings(workouts: Workout[]): string[] {
  return Object.values(EXERCISES)
    .filter((e) => e.compound)
    .filter((e) => strengthWarning(exerciseHistory(workouts, e.id).map((h) => topSetKg(h.log))))
    .map((e) => e.id)
}

/**
 * "Lifts going down" for rule 3: any compound lift whose latest top set within
 * the 14 days ending on `date` is lower than its first top set in that window.
 */
export function liftsGoingDown(workouts: Workout[], date: ISODate): boolean {
  const from = addDays(date, -(RULES.rateLookbackDays - 1))
  return Object.values(EXERCISES)
    .filter((e) => e.compound)
    .some((e) => {
      const tops = exerciseHistory(workouts, e.id)
        .filter((h) => h.date >= from && h.date <= date)
        .map((h) => topSetKg(h.log))
        .filter((x): x is number => x != null)
      return tops.length >= 2 && tops[tops.length - 1] < tops[0]
    })
}

/** Build a fresh session pre-filled from the template (and last time's loads). */
export function newWorkout(template: TemplateId, date: ISODate, workouts: Workout[], startedAt: string): Workout {
  const exercises: ExerciseLog[] = TEMPLATES[template].exercises.map((id) => {
    const last = exerciseHistory(workouts, id, { before: addDays(date, 1) }).at(-1)
    const lastTop = topSetKg(last?.log)
    const n = setsFor(template, id)
    return {
      exerciseId: id,
      sets: Array.from({ length: n }, () => ({ kg: lastTop, reps: null })),
    }
  })
  return { date, template, exercises, completed: false, startedAt }
}
