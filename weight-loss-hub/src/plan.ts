/**
 * THE PLAN — single source of truth.
 *
 * Every number and rule threshold the app uses lives here. Change a value here
 * and every screen and calculation picks it up. Dates are ISO `YYYY-MM-DD`
 * (local calendar days, no time zone).
 */

export type ISODate = string

// ---------------------------------------------------------------------------
// Units
// ---------------------------------------------------------------------------
export const UNITS = {
  kgPerStone: 6.35029,
  lbPerKg: 2.20462,
  lbPerStone: 14,
} as const

// ---------------------------------------------------------------------------
// Goal
// ---------------------------------------------------------------------------
export const GOAL = {
  startDate: '2026-10-18',
  startKg: 95.75,
  resetDate: '2026-10-31',
  resetAvgKg: 96.7,
  milestones: [
    { id: 'm1', label: '1.5 st down', kg: 86.2, date: '2027-01-01' },
    { id: 'm2', label: '2 st down', kg: 83.0, date: '2027-01-31' },
  ],
} as const

export type Milestone = (typeof GOAL.milestones)[number]

/** Target path for the 7-day average. Interpolate linearly between points. */
export const TARGET_PATH: ReadonlyArray<{ date: ISODate; kg: number; note?: string }> = [
  { date: '2026-10-31', kg: 96.7, note: 'Restart point' },
  { date: '2026-11-08', kg: 94.7, note: 'About 2 kg off in the first week, mostly water' },
  { date: '2026-11-15', kg: 93.6 },
  { date: '2026-11-22', kg: 92.5 },
  { date: '2026-11-29', kg: 91.4 },
  { date: '2026-12-06', kg: 90.3, note: 'Behind-schedule check (rule 4)' },
  { date: '2026-12-13', kg: 89.2 },
  { date: '2026-12-20', kg: 88.1 },
  { date: '2026-12-27', kg: 87.0 },
  { date: '2027-01-01', kg: 86.2, note: '1.5 stone down' },
  { date: '2027-01-10', kg: 85.3 },
  { date: '2027-01-17', kg: 84.5 },
  { date: '2027-01-24', kg: 83.8 },
  { date: '2027-01-31', kg: 83.0, note: '2 stone down' },
]

// ---------------------------------------------------------------------------
// Schedule
// ---------------------------------------------------------------------------
export type SessionKind = 'jog' | 'strength' | 'football' | 'rest'
export type TemplateId = 'A' | 'B' | 'C'

export interface DaySchedule {
  title: string
  kind: SessionKind
  template?: TemplateId
  length?: string
  when?: string
  extra?: string
}

/** Keyed by JS weekday: 0 = Sunday … 6 = Saturday. */
export const WEEKLY_SCHEDULE: Record<number, DaySchedule> = {
  1: { title: 'Easy jog (treadmill or lit route)', kind: 'jog', length: '20–40 min', when: 'After school or evening' },
  2: { title: 'Strength C: full body', kind: 'strength', template: 'C', length: '55–60 min', when: 'Straight after school' },
  3: { title: 'Rest: steps and cook-up', kind: 'rest' },
  4: { title: 'Football', kind: 'football', length: '60 min', when: 'Evening' },
  5: { title: 'Rest: steps only', kind: 'rest' },
  6: { title: 'Strength A: lower body', kind: 'strength', template: 'A', length: '55–60 min', when: 'Morning, 08:00–10:00' },
  0: {
    title: 'Strength B: upper body',
    kind: 'strength',
    template: 'B',
    length: '55–60 min',
    when: 'Morning, 08:00–10:00',
    extra: 'Then weekly review and cook-up',
  },
}

export const FESTIVE = {
  start: '2026-12-19',
  end: '2027-01-01',
  weekdayWhen: '10:00–11:30',
  footballReplacement: { title: '40-min jog or incline walk', kind: 'jog' as SessionKind, length: '40 min' },
} as const

export const JOG = {
  progressionStart: GOAL.resetDate,
  startMin: 20,
  startMax: 25,
  stepMinPerFortnight: 5,
  capMin: 35,
  capMax: 40,
  intervalOption: 'or alternate 4 min jogging with 1 min walking',
  maxRunsPerWeek: 2,
} as const

/** Pull-up max test days (Strength B). */
export const PULLUP_TEST_DAYS: ISODate[] = ['2026-11-22', '2026-12-27']
export const PULLUP_BASELINE_MAX = 7

// ---------------------------------------------------------------------------
// Strength sessions
// ---------------------------------------------------------------------------
export type RepScheme =
  | { type: 'range'; min: number; max: number }
  | { type: 'maxMinusOne'; test: 'pullup' | 'dips' }

export interface ExerciseDef {
  id: string
  name: string
  sets: number
  reps: RepScheme
  compound: boolean
  bodyweight: boolean
  dumbbell?: boolean
  perSide?: boolean
  note?: string
}

export const SESSION_RULES = {
  warmUp: '8 min: 5 min bike or rower, then 2 lighter warm-up sets of the first lift',
  effortCompound: 'Stop 1–2 reps short of failure',
  effortAccessory: 'Stop 1 rep short of failure',
  restCompoundSec: { min: 120, max: 180, default: 150 },
  restAccessorySec: { min: 60, max: 90, default: 75 },
  progressionKg: 2.5,
} as const

export const EXERCISES: Record<string, ExerciseDef> = {
  backSquat: { id: 'backSquat', name: 'Back squat', sets: 3, reps: { type: 'range', min: 5, max: 8 }, compound: true, bodyweight: false },
  rdl: { id: 'rdl', name: 'Romanian deadlift', sets: 3, reps: { type: 'range', min: 6, max: 8 }, compound: true, bodyweight: false },
  splitSquat: { id: 'splitSquat', name: 'Dumbbell split squats', sets: 3, reps: { type: 'range', min: 10, max: 10 }, compound: false, bodyweight: false, dumbbell: true, perSide: true, note: '10 each leg' },
  legCurl: { id: 'legCurl', name: 'Leg curl (lying or seated)', sets: 3, reps: { type: 'range', min: 10, max: 15 }, compound: false, bodyweight: false },
  legRaise: { id: 'legRaise', name: 'Hanging leg raises', sets: 3, reps: { type: 'range', min: 10, max: 12 }, compound: false, bodyweight: true },
  pullup: { id: 'pullup', name: 'Pull-ups', sets: 4, reps: { type: 'maxMinusOne', test: 'pullup' }, compound: false, bodyweight: true },
  dbBench: { id: 'dbBench', name: 'Dumbbell bench press', sets: 3, reps: { type: 'range', min: 8, max: 10 }, compound: true, bodyweight: false, dumbbell: true },
  ohp: { id: 'ohp', name: 'Overhead press (barbell or dumbbell)', sets: 3, reps: { type: 'range', min: 6, max: 10 }, compound: true, bodyweight: false },
  cableRow: { id: 'cableRow', name: 'Seated cable row', sets: 3, reps: { type: 'range', min: 10, max: 12 }, compound: false, bodyweight: false },
  dips: { id: 'dips', name: 'Dips', sets: 3, reps: { type: 'maxMinusOne', test: 'dips' }, compound: false, bodyweight: true },
  legPress: { id: 'legPress', name: 'Leg press', sets: 3, reps: { type: 'range', min: 10, max: 12 }, compound: true, bodyweight: false, note: 'Stop 2 reps short of failure (football in two days)' },
  incDbPress: { id: 'incDbPress', name: 'Incline dumbbell press', sets: 3, reps: { type: 'range', min: 8, max: 12 }, compound: false, bodyweight: false, dumbbell: true },
  csRow: { id: 'csRow', name: 'Chest-supported row', sets: 3, reps: { type: 'range', min: 10, max: 12 }, compound: false, bodyweight: false },
  cableCrunch: { id: 'cableCrunch', name: 'Cable crunch', sets: 3, reps: { type: 'range', min: 12, max: 15 }, compound: false, bodyweight: false },
}

export interface TemplateDef {
  id: TemplateId
  name: string
  day: string
  exercises: string[]
}

export const TEMPLATES: Record<TemplateId, TemplateDef> = {
  A: { id: 'A', name: 'Strength A: lower body', day: 'Saturday', exercises: ['backSquat', 'rdl', 'splitSquat', 'legCurl', 'legRaise'] },
  B: { id: 'B', name: 'Strength B: upper body', day: 'Sunday', exercises: ['pullup', 'dbBench', 'ohp', 'cableRow', 'dips'] },
  C: { id: 'C', name: 'Strength C: full body', day: 'Tuesday', exercises: ['legPress', 'pullup', 'incDbPress', 'csRow', 'cableCrunch'] },
}

/** Template B sets for pull-ups; Template C uses 3 sets. */
export const TEMPLATE_SET_OVERRIDES: Partial<Record<TemplateId, Record<string, number>>> = {
  C: { pullup: 3 },
}

// ---------------------------------------------------------------------------
// Daily targets
// ---------------------------------------------------------------------------
export const DAILY = {
  kcal: 1900,
  kcalFloor: 1750,
  proteinMin: 160,
  proteinMax: 180,
  proteinPerMeal: 40,
  meals: 4,
  fatG: 60,
  carbsG: 170,
  fibreMinG: 30,
  stepsEarly: 10000,
  stepsLater: 12000,
  /** 10,000 steps up to and including this date, then 12,000. */
  stepsSwitchAfter: '2026-11-08',
  waterMinL: 2.5,
  waterMaxL: 3,
  sleepMinH: 7,
  sleepMaxH: 8,
  creatine: 'Daily, with no stopping or starting mid-plan',
} as const

// ---------------------------------------------------------------------------
// Rules
// ---------------------------------------------------------------------------
export const RULES = {
  avgWindowDays: 7,
  avgMinReadings: 3,
  statusBandKg: 0.5,
  adviceFrom: '2026-11-15',
  rateLookbackDays: 14,
  rateBands: {
    goodMin: 0.9,
    goodMax: 1.4,
    slowMin: 0.5,
    fastOver: 1.5,
  },
  stepsAdd: 2000,
  kcalCut: 150,
  kcalAddCarbs: 150,
  dec6CheckDate: '2026-12-06',
  dec6BehindKg: 2,
  projectionWindowDays: 14,
  waistFrom: '2026-11-01',
  waistEveryDays: 14,
} as const

export const AUDIT = {
  days: 3,
  oilTbspKcal: 120,
} as const

// ---------------------------------------------------------------------------
// Seed data (loaded on first run)
// ---------------------------------------------------------------------------
export const SEED = {
  heightCm: 174,
  bodyComp: {
    date: '2026-10-18',
    weightKg: 95.75,
    bmi: 31.6,
    bodyFatPct: 31.8,
    subcutaneousFatPct: 27.6,
    visceralFat: 14,
    muscleMassKg: 62.05,
    skeletalMusclePct: 43.9,
    boneMassKg: 3.25,
    fatFreeMassKg: 65.3,
    bmrKcal: 1773,
    bodyWaterPct: 49.2,
    proteinPct: 15.6,
    metabolicAge: 36,
  },
  weighIns: [
    { date: '2026-10-18', kg: 95.75 },
    { date: '2026-10-27', kg: 96.95 },
    { date: '2026-10-28', kg: 96.95 },
    { date: '2026-10-29', kg: 96.5 },
    { date: '2026-10-31', kg: 96.35 },
  ],
  seedTime: '07:00',
} as const
