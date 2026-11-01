import type { ISODate, TemplateId } from '../plan'

export interface WeighIn {
  id?: number
  date: ISODate
  time: string // HH:mm
  kg: number
}

export interface SetEntry {
  kg: number | null // load; for bodyweight moves, *added* kg (null/0 = bodyweight only)
  reps: number | null
  warmup?: boolean
  done?: boolean
}

export interface ExerciseLog {
  exerciseId: string
  sets: SetEntry[]
}

export interface Workout {
  id?: number
  date: ISODate
  template: TemplateId
  exercises: ExerciseLog[]
  completed: boolean
  startedAt: string // ISO timestamp
  completedAt?: string
  notes?: string
}

export interface MaxTest {
  id?: number
  date: ISODate
  test: 'pullup' | 'dips'
  reps: number
}

export interface BodyComp {
  date: ISODate
  weightKg?: number
  bmi?: number
  bodyFatPct?: number
  subcutaneousFatPct?: number
  visceralFat?: number
  muscleMassKg?: number
  skeletalMusclePct?: number
  boneMassKg?: number
  fatFreeMassKg?: number
  bmrKcal?: number
  bodyWaterPct?: number
  proteinPct?: number
  metabolicAge?: number
}

export interface CheckIn {
  date: ISODate // a Sunday
  waistCm?: number
  notes?: string
  /** Rule-3 actions applied from this check-in (e.g. "addSteps"). */
  applied?: string[]
  savedAt: string
}

export interface HabitDay {
  date: ISODate
  kcal?: number
  protein?: number
  steps?: number
  waterL?: number
  sleepH?: number
  sessionDone?: boolean
  creatine?: boolean
}

export interface AuditEntry {
  id?: number
  date: ISODate
  meal: string
  kcal: number
  protein: number
}

/** Settings start from plan.ts defaults; adjustments from rule 3 are applied here. */
export interface Settings {
  id: 'settings'
  heightCm: number
  kcalTarget: number
  proteinMin: number
  proteinMax: number
  fatG: number
  carbsG: number
  fibreMinG: number
  /** Extra daily steps on top of the plan's base step target (rule 3 adjustments). */
  stepsExtra: number
  waterMinL: number
  sleepMinH: number
  footballPausedForHolidays: boolean
  theme: 'system' | 'light' | 'dark'
  auditStart?: ISODate
  seededAt: string
}
