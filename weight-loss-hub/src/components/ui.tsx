import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode } from 'react'
import type { Status } from '../lib/weight'
import { STATUS_LABEL } from '../lib/weight'

export function Card({ title, children, className = '', action }: { title?: ReactNode; children: ReactNode; className?: string; action?: ReactNode }) {
  return (
    <section className={`rounded-2xl bg-white p-4 shadow-sm dark:bg-slate-900 ${className}`}>
      {(title || action) && (
        <div className="mb-3 flex items-center justify-between gap-2">
          {title && <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">{title}</h2>}
          {action}
        </div>
      )}
      {children}
    </section>
  )
}

export function Stat({ label, value, sub, big = false }: { label: string; value: ReactNode; sub?: ReactNode; big?: boolean }) {
  return (
    <div>
      <div className="text-xs font-medium text-slate-500 dark:text-slate-400">{label}</div>
      <div className={`tabular font-bold leading-tight ${big ? 'text-4xl' : 'text-2xl'}`}>{value}</div>
      {sub && <div className="tabular text-xs text-slate-500 dark:text-slate-400">{sub}</div>}
    </div>
  )
}

const STATUS_STYLE: Record<Status, string> = {
  'on-track': 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300',
  behind: 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300',
  ahead: 'bg-sky-100 text-sky-800 dark:bg-sky-900/50 dark:text-sky-300',
}

export function StatusPill({ status }: { status: Status | null }) {
  if (!status) return <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">No status</span>
  return <span className={`rounded-full px-3 py-1 text-sm font-semibold ${STATUS_STYLE[status]}`}>{STATUS_LABEL[status]}</span>
}

type BtnVariant = 'primary' | 'secondary' | 'danger' | 'ghost'
const BTN: Record<BtnVariant, string> = {
  primary: 'bg-brand-700 text-white active:bg-brand-900 disabled:opacity-40',
  secondary: 'bg-slate-200 text-slate-900 active:bg-slate-300 dark:bg-slate-800 dark:text-slate-100 dark:active:bg-slate-700',
  danger: 'bg-rose-600 text-white active:bg-rose-800',
  ghost: 'text-brand-700 dark:text-brand-500 active:bg-slate-100 dark:active:bg-slate-800',
}

export function Button({ variant = 'primary', className = '', ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: BtnVariant }) {
  return <button type="button" className={`min-h-12 rounded-xl px-4 font-semibold transition-colors ${BTN[variant]} ${className}`} {...props} />
}

/** Numeric field that brings up the decimal keypad on iPhone. */
export function NumberField({ label, className = '', suffix, ...props }: InputHTMLAttributes<HTMLInputElement> & { label?: string; suffix?: string }) {
  return (
    <label className={`block ${className}`}>
      {label && <span className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">{label}</span>}
      <span className="relative block">
        <input
          type="text"
          inputMode="decimal"
          autoComplete="off"
          className="tabular h-12 w-full rounded-xl border border-slate-300 bg-white px-3 text-lg font-semibold outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-500/30 dark:border-slate-700 dark:bg-slate-950"
          {...props}
        />
        {suffix && <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">{suffix}</span>}
      </span>
    </label>
  )
}

export function TextField({ label, className = '', ...props }: InputHTMLAttributes<HTMLInputElement> & { label?: string }) {
  return (
    <label className={`block ${className}`}>
      {label && <span className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">{label}</span>}
      <input
        className="h-12 w-full rounded-xl border border-slate-300 bg-white px-3 outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-500/30 dark:border-slate-700 dark:bg-slate-950"
        {...props}
      />
    </label>
  )
}

/** Parse a user-typed decimal ("96,4" is accepted too). */
export function parseNum(s: string): number | null {
  const t = s.trim().replace(',', '.')
  if (t === '') return null
  const n = Number(t)
  return Number.isFinite(n) ? n : null
}

export function PageHeader({ title, right }: { title: string; right?: ReactNode }) {
  return (
    <header className="flex items-center justify-between px-1 pb-3 pt-2">
      <h1 className="text-2xl font-bold">{title}</h1>
      {right}
    </header>
  )
}
