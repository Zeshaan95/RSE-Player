import { Link } from 'react-router-dom'
import type { SessionForDay } from '../lib/schedule'

const ICON: Record<string, string> = { jog: '🏃', strength: '🏋️', football: '⚽', rest: '🚶' }

export function SessionCard({ s, isToday }: { s: SessionForDay; isToday: boolean }) {
  return (
    <div>
      <div className="flex items-start gap-3">
        <div className="text-3xl" aria-hidden>{ICON[s.kind]}</div>
        <div className="min-w-0 flex-1">
          <div className="text-xl font-bold leading-tight">{s.title}</div>
          <div className="mt-0.5 text-sm text-slate-600 dark:text-slate-300">{[s.length, s.when].filter(Boolean).join(' · ')}</div>
        </div>
      </div>
      {s.notes.length > 0 && (
        <ul className="mt-3 space-y-1 text-sm">
          {s.notes.map((n) => (
            <li key={n} className={`rounded-lg px-3 py-2 ${n.startsWith('Pull-up max test') ? 'bg-amber-100 font-semibold text-amber-900 dark:bg-amber-900/40 dark:text-amber-200' : n === 'Festive fortnight' ? 'bg-rose-50 text-rose-800 dark:bg-rose-900/30 dark:text-rose-200' : 'bg-slate-100 dark:bg-slate-800'}`}>
              {n}
            </li>
          ))}
        </ul>
      )}
      {s.kind === 'strength' && isToday && (
        <Link to={s.template ? `/workout?start=${s.template}` : '/workout'} className="mt-3 flex min-h-12 items-center justify-center rounded-xl bg-brand-700 font-semibold text-white active:bg-brand-900">
          Start {s.template ? `Strength ${s.template}` : 'session'}
        </Link>
      )}
      {s.weeklyReview && isToday && (
        <Link to="/checkin" className="mt-2 flex min-h-12 items-center justify-center rounded-xl bg-slate-200 font-semibold active:bg-slate-300 dark:bg-slate-800">
          Weekly check-in
        </Link>
      )}
    </div>
  )
}
