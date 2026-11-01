import { lazy, Suspense, useEffect } from 'react'
import { BrowserRouter, NavLink, Route, Routes } from 'react-router-dom'
import { ensureSeeded, requestPersistence } from './db/db'
import { useSettings, useTheme } from './hooks'
import Today from './screens/Today'
import WeighIns from './screens/WeighIns'

const Workout = lazy(() => import('./screens/Workout'))
const Progress = lazy(() => import('./screens/Progress'))
const More = lazy(() => import('./screens/More'))
const CheckIn = lazy(() => import('./screens/CheckIn'))
const Habits = lazy(() => import('./screens/Habits'))
const Audit = lazy(() => import('./screens/Audit'))
const SettingsScreen = lazy(() => import('./screens/Settings'))

const TABS = [
  { to: '/', label: 'Today', icon: '☀️' },
  { to: '/weigh', label: 'Weigh', icon: '⚖️' },
  { to: '/workout', label: 'Workout', icon: '🏋️' },
  { to: '/progress', label: 'Progress', icon: '📈' },
  { to: '/more', label: 'More', icon: '☰' },
]

function TabBar() {
  return (
    <nav className="pb-safe fixed inset-x-0 bottom-0 z-20 border-t border-slate-200 bg-white/95 backdrop-blur dark:border-slate-800 dark:bg-slate-900/95">
      <ul className="mx-auto grid max-w-lg grid-cols-5">
        {TABS.map((t) => (
          <li key={t.to}>
            <NavLink
              to={t.to}
              end={t.to === '/'}
              className={({ isActive }) => `flex h-16 flex-col items-center justify-center gap-0.5 text-xs font-medium ${isActive ? 'text-brand-700 dark:text-brand-500' : 'text-slate-500'}`}
            >
              <span className="text-xl leading-none" aria-hidden>{t.icon}</span>
              {t.label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}

export default function App() {
  const settings = useSettings()
  useTheme(settings.theme)
  useEffect(() => {
    ensureSeeded().then(() => requestPersistence())
  }, [])
  return (
    <BrowserRouter>
      <main className="pt-safe mx-auto max-w-lg px-3 pb-24">
        <Suspense fallback={<div className="p-8 text-center text-slate-500">Loading…</div>}>
          <Routes>
            <Route path="/" element={<Today />} />
            <Route path="/weigh" element={<WeighIns />} />
            <Route path="/workout" element={<Workout />} />
            <Route path="/progress" element={<Progress />} />
            <Route path="/more" element={<More />} />
            <Route path="/checkin" element={<CheckIn />} />
            <Route path="/habits" element={<Habits />} />
            <Route path="/audit" element={<Audit />} />
            <Route path="/settings" element={<SettingsScreen />} />
            <Route path="*" element={<Today />} />
          </Routes>
        </Suspense>
      </main>
      <TabBar />
    </BrowserRouter>
  )
}
