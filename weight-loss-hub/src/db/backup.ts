import { TABLES, type HubDB } from './db'
import { fmtDate } from '../lib/dates'
import { EXERCISES } from '../plan'
import type { WeighIn, Workout } from './types'
import { epley1RM } from '../lib/strength'

export const BACKUP_FORMAT = 'weight-loss-hub-backup'
export const BACKUP_VERSION = 1

export interface Backup {
  format: typeof BACKUP_FORMAT
  version: number
  exportedAt: string
  tables: Record<string, unknown[]>
}

export async function exportAll(d: HubDB): Promise<Backup> {
  const tables: Record<string, unknown[]> = {}
  await d.transaction('r', d.tables, async () => {
    for (const t of TABLES) tables[t] = await d.table(t).toArray()
  })
  return { format: BACKUP_FORMAT, version: BACKUP_VERSION, exportedAt: new Date().toISOString(), tables }
}

export function validateBackup(data: unknown): Backup {
  const b = data as Backup
  if (!b || b.format !== BACKUP_FORMAT || typeof b.tables !== 'object') throw new Error('This file isn’t a Weight-loss Hub backup.')
  if (b.version > BACKUP_VERSION) throw new Error('This backup is from a newer version of the app.')
  for (const t of TABLES) if (b.tables[t] && !Array.isArray(b.tables[t])) throw new Error(`Backup table “${t}” is invalid.`)
  return b
}

/** Replace everything with the backup's contents (exact restore, ids included). */
export async function importAll(d: HubDB, data: unknown): Promise<void> {
  const b = validateBackup(data)
  await d.transaction('rw', d.tables, async () => {
    for (const t of TABLES) {
      await d.table(t).clear()
      const rows = b.tables[t] ?? []
      if (rows.length) await d.table(t).bulkPut(rows)
    }
  })
}

function csvCell(v: unknown): string {
  const s = v == null ? '' : String(v)
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

export function toCsv(rows: unknown[][]): string {
  return rows.map((r) => r.map(csvCell).join(',')).join('\n') + '\n'
}

export function weighInsCsv(weighIns: WeighIn[]): string {
  const sorted = [...weighIns].sort((a, b) => (a.date + a.time < b.date + b.time ? -1 : 1))
  return toCsv([['date', 'date_uk', 'time', 'kg'], ...sorted.map((w) => [w.date, fmtDate(w.date), w.time, w.kg.toFixed(2)])])
}

export function liftsCsv(workouts: Workout[]): string {
  const rows: unknown[][] = [['date', 'date_uk', 'session', 'exercise', 'set', 'warmup', 'kg', 'reps', 'est_1rm_kg', 'completed']]
  const sorted = [...workouts].sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : (a.id ?? 0) - (b.id ?? 0)))
  for (const w of sorted) {
    for (const e of w.exercises) {
      e.sets.forEach((s, i) => {
        if (s.reps == null && s.kg == null) return
        const est = s.kg && s.reps ? epley1RM(s.kg, s.reps).toFixed(1) : ''
        rows.push([w.date, fmtDate(w.date), w.template, EXERCISES[e.exerciseId]?.name ?? e.exerciseId, i + 1, s.warmup ? 'yes' : 'no', s.kg ?? '', s.reps ?? '', est, w.completed ? 'yes' : 'no'])
      })
    }
  }
  return toCsv(rows)
}

export function download(filename: string, content: string, type: string) {
  const blob = new Blob([content], { type })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
