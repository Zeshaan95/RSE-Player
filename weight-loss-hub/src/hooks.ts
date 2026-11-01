import { useLiveQuery } from 'dexie-react-hooks'
import { useEffect, useMemo, useState } from 'react'
import { db, defaultSettings, BASELINE_MAXES } from './db/db'
import type { Settings } from './db/types'
import { dailyReadings } from './lib/weight'
import { latestMaxes } from './lib/strength'
import { todayISO } from './lib/dates'

export function useSettings(): Settings {
  return useLiveQuery(() => db.settings.get('settings'), []) ?? defaultSettings()
}

export function updateSettings(patch: Partial<Settings>) {
  return db.settings.update('settings', patch)
}

export function useWeighIns() {
  return useLiveQuery(() => db.weighIns.toArray(), []) ?? []
}

export function useDaily() {
  const weighIns = useWeighIns()
  return useMemo(() => dailyReadings(weighIns), [weighIns])
}

export function useWorkouts() {
  return useLiveQuery(() => db.workouts.toArray(), []) ?? []
}

export function useMaxes() {
  const tests = useLiveQuery(() => db.maxTests.toArray(), []) ?? []
  return useMemo(() => latestMaxes(tests, BASELINE_MAXES), [tests])
}

/** Today's local date, refreshed when the app comes back to the foreground or crosses midnight. */
export function useToday() {
  const [today, setToday] = useState(todayISO())
  useEffect(() => {
    const tick = () => setToday(todayISO())
    const id = setInterval(tick, 60_000)
    document.addEventListener('visibilitychange', tick)
    return () => {
      clearInterval(id)
      document.removeEventListener('visibilitychange', tick)
    }
  }, [])
  return today
}

export function useTheme(theme: Settings['theme']) {
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const apply = () => {
      const dark = theme === 'dark' || (theme === 'system' && mq.matches)
      document.documentElement.classList.toggle('dark', dark)
      document.querySelector('meta[name="theme-color"]')?.setAttribute('content', dark ? '#020617' : '#0f766e')
    }
    apply()
    mq.addEventListener('change', apply)
    return () => mq.removeEventListener('change', apply)
  }, [theme])
}
