import 'fake-indexeddb/auto'
import { describe, expect, it } from 'vitest'
import { HubDB, ensureSeeded, TABLES } from './db'
import { exportAll, importAll, liftsCsv, weighInsCsv } from './backup'
import { SEED } from '../plan'

describe('seed + backup', () => {
  it('seeds once on first run', async () => {
    const d = new HubDB('t-seed')
    expect(await ensureSeeded(d)).toBe(true)
    expect(await ensureSeeded(d)).toBe(false)
    expect(await d.weighIns.count()).toBe(SEED.weighIns.length)
    expect((await d.bodyComp.get('2026-10-18'))?.bmrKcal).toBe(1773)
    expect((await d.settings.get('settings'))?.heightCm).toBe(174)
  })

  it('export followed by import restores everything exactly', async () => {
    const a = new HubDB('t-a')
    await ensureSeeded(a)
    await a.weighIns.add({ date: '2026-11-01', time: '06:45', kg: 96.1 })
    await a.workouts.add({ date: '2026-11-01', template: 'B', completed: true, startedAt: '2026-11-01T08:00:00Z', completedAt: '2026-11-01T09:00:00Z', exercises: [{ exerciseId: 'dbBench', sets: [{ kg: 30, reps: 10 }, { kg: 30, reps: 9, warmup: false }] }] })
    await a.maxTests.add({ date: '2026-11-22', test: 'pullup', reps: 8 })
    await a.checkIns.put({ date: '2026-11-01', waistCm: 104.5, notes: 'Good week, "busy"', savedAt: 'x' })
    await a.habits.put({ date: '2026-11-01', kcal: 1880, protein: 172, steps: 11000, waterL: 2.8, sleepH: 7.5, sessionDone: true, creatine: true })
    await a.auditEntries.add({ date: '2026-11-02', meal: 'Breakfast', kcal: 450, protein: 40 })
    await a.settings.update('settings', { stepsExtra: 2000, kcalTarget: 1750 })
    const backup = JSON.parse(JSON.stringify(await exportAll(a)))

    const b = new HubDB('t-b')
    await ensureSeeded(b)
    await b.weighIns.add({ date: '2030-01-01', time: '00:00', kg: 1 }) // should be wiped
    await importAll(b, backup)
    for (const t of TABLES) {
      expect(await b.table(t).toArray()).toEqual(await a.table(t).toArray())
    }
    // ids preserved, so new rows keep incrementing safely
    const id = await b.weighIns.add({ date: '2026-11-02', time: '07:00', kg: 95.9 })
    expect(id).toBeGreaterThan(Math.max(...(await a.weighIns.toArray()).map((w) => w.id!)))
  })

  it('rejects files that are not backups', async () => {
    const d = new HubDB('t-bad')
    await expect(importAll(d, { foo: 1 })).rejects.toThrow(/isn’t a Weight-loss Hub backup/)
  })

  it('CSV exports', () => {
    const csv = weighInsCsv([{ date: '2026-10-31', time: '07:00', kg: 96.35 }])
    expect(csv).toBe('date,date_uk,time,kg\n2026-10-31,31 Oct 2026,07:00,96.35\n')
    const lifts = liftsCsv([{ date: '2026-11-07', template: 'A', completed: true, startedAt: 'x', exercises: [{ exerciseId: 'backSquat', sets: [{ kg: 100, reps: 5 }] }] }])
    expect(lifts.split('\n')[1]).toBe('2026-11-07,7 Nov 2026,A,Back squat,1,no,100,5,116.7,yes')
  })
})
