import { Link } from 'react-router-dom'
import { PageHeader } from '../components/ui'

const ITEMS = [
  { to: '/checkin', label: 'Weekly check-in', sub: 'Sunday status, waist, advice', icon: '🗓️' },
  { to: '/habits', label: 'Daily habits', sub: 'Calories, protein, steps, water, sleep', icon: '✅' },
  { to: '/audit', label: 'Food audit', sub: '3-day weigh-and-log', icon: '🍽️' },
  { to: '/settings', label: 'Settings', sub: 'Targets, height, backup, reset', icon: '⚙️' },
]

export default function More() {
  return (
    <div className="space-y-3">
      <PageHeader title="More" />
      <ul className="space-y-2">
        {ITEMS.map((i) => (
          <li key={i.to}>
            <Link to={i.to} className="flex min-h-16 items-center gap-3 rounded-2xl bg-white p-4 shadow-sm active:bg-slate-50 dark:bg-slate-900 dark:active:bg-slate-800">
              <span className="text-2xl" aria-hidden>{i.icon}</span>
              <span className="flex-1">
                <span className="block font-semibold">{i.label}</span>
                <span className="block text-sm text-slate-500">{i.sub}</span>
              </span>
              <span className="text-slate-400">›</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
