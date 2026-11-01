import type { ISODate } from '../plan'

const MS_DAY = 86_400_000
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const DAYS_LONG = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

/** Day number (days since 1970-01-01) for an ISO date — immune to DST. */
export function dayNum(iso: ISODate): number {
  const [y, m, d] = iso.split('-').map(Number)
  return Math.round(Date.UTC(y, m - 1, d) / MS_DAY)
}

export function fromDayNum(n: number): ISODate {
  return new Date(n * MS_DAY).toISOString().slice(0, 10)
}

export function addDays(iso: ISODate, days: number): ISODate {
  return fromDayNum(dayNum(iso) + days)
}

export function daysBetween(from: ISODate, to: ISODate): number {
  return dayNum(to) - dayNum(from)
}

/** 0 = Sunday … 6 = Saturday */
export function weekday(iso: ISODate): number {
  return new Date(dayNum(iso) * MS_DAY).getUTCDay()
}

export function isSunday(iso: ISODate): boolean {
  return weekday(iso) === 0
}

/** Local calendar date for a JS Date (defaults to now). */
export function todayISO(now: Date = new Date()): ISODate {
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function nowTime(now: Date = new Date()): string {
  return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
}

/** "31 Oct 2026" */
export function fmtDate(iso: ISODate): string {
  const [y, m, d] = iso.split('-').map(Number)
  return `${d} ${MONTHS[m - 1]} ${y}`
}

/** "Sun 1 Nov 2026" */
export function fmtDateDay(iso: ISODate): string {
  return `${DAYS[weekday(iso)]} ${fmtDate(iso)}`
}

/** "Sunday 1 November" style long label for headings. */
export function fmtLong(iso: ISODate): string {
  const [, m, d] = iso.split('-').map(Number)
  const longMonths = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
  return `${DAYS_LONG[weekday(iso)]} ${d} ${longMonths[m - 1]}`
}

/** "31 Oct" — for chart axes. */
export function fmtShort(iso: ISODate): string {
  const [, m, d] = iso.split('-').map(Number)
  return `${d} ${MONTHS[m - 1]}`
}

/** Monday of the week containing iso (UK weeks run Mon–Sun). */
export function weekStart(iso: ISODate): ISODate {
  const wd = weekday(iso)
  return addDays(iso, wd === 0 ? -6 : 1 - wd)
}

export function inRange(iso: ISODate, start: ISODate, end: ISODate): boolean {
  return iso >= start && iso <= end
}
