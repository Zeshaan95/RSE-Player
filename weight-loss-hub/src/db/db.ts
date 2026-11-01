import Dexie, { type Table } from 'dexie'
import type { AuditEntry, BodyComp, CheckIn, HabitDay, MaxTest, Settings, WeighIn, Workout } from './types'
import { DAILY, PULLUP_BASELINE_MAX, SEED } from '../plan'

export class HubDB extends Dexie {
  weighIns!: Table<WeighIn, number>
  workouts!: Table<Workout, number>
  maxTests!: Table<MaxTest, number>
  bodyComp!: Table<BodyComp, string>
  checkIns!: Table<CheckIn, string>
  habits!: Table<HabitDay, string>
  auditEntries!: Table<AuditEntry, number>
  settings!: Table<Settings, string>

  constructor(name = 'weight-loss-hub') {
    super(name)
    this.version(1).stores({
      weighIns: '++id, date',
      workouts: '++id, date, template, completed',
      maxTests: '++id, date, test',
      bodyComp: 'date',
      checkIns: 'date',
      habits: 'date',
      auditEntries: '++id, date',
      settings: 'id',
    })
  }
}

export const db = new HubDB()

export const TABLES = ['weighIns', 'workouts', 'maxTests', 'bodyComp', 'checkIns', 'habits', 'auditEntries', 'settings'] as const
export type TableName = (typeof TABLES)[number]

export function defaultSettings(): Settings {
  return {
    id: 'settings',
    heightCm: SEED.heightCm,
    kcalTarget: DAILY.kcal,
    proteinMin: DAILY.proteinMin,
    proteinMax: DAILY.proteinMax,
    fatG: DAILY.fatG,
    carbsG: DAILY.carbsG,
    fibreMinG: DAILY.fibreMinG,
    stepsExtra: 0,
    waterMinL: DAILY.waterMinL,
    sleepMinH: DAILY.sleepMinH,
    footballPausedForHolidays: false,
    theme: 'system',
    seededAt: new Date().toISOString(),
  }
}

/** Load the seed data on first run (no settings row yet). Idempotent. */
export async function ensureSeeded(d: HubDB = db): Promise<boolean> {
  return d.transaction('rw', d.tables, async () => {
    if (await d.settings.get('settings')) return false
    await d.settings.put(defaultSettings())
    await d.weighIns.bulkAdd(SEED.weighIns.map((w) => ({ date: w.date, kg: w.kg, time: SEED.seedTime })))
    await d.bodyComp.put({ ...SEED.bodyComp })
    return true
  })
}

/** Pull-up baseline (previous best) used until a max test is logged. */
export const BASELINE_MAXES = { pullup: PULLUP_BASELINE_MAX, dips: null as number | null }

export async function requestPersistence(): Promise<boolean | null> {
  if (!navigator.storage?.persist) return null
  if (await navigator.storage.persisted()) return true
  return navigator.storage.persist()
}
