/** Local-date helpers used for streaks and daily study minutes (not UTC, so a
 * student's "today" matches their wall-clock day). */

export function dateKey(d: Date = new Date()): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function daysBetween(aKey: string, bKey: string): number {
  const a = new Date(aKey + 'T00:00:00')
  const b = new Date(bKey + 'T00:00:00')
  return Math.round((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24))
}

export function yesterdayKey(fromKey: string = dateKey()): string {
  const d = new Date(fromKey + 'T00:00:00')
  d.setDate(d.getDate() - 1)
  return dateKey(d)
}
