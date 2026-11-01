import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react'

interface TimerCtx {
  start: (seconds: number, label: string) => void
}
const Ctx = createContext<TimerCtx>({ start: () => {} })
export const useRestTimer = () => useContext(Ctx)

function beep() {
  try {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    const ac = new AC()
    ;[0, 0.25, 0.5].forEach((t) => {
      const o = ac.createOscillator()
      const g = ac.createGain()
      o.frequency.value = 880
      g.gain.setValueAtTime(0.2, ac.currentTime + t)
      g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + t + 0.2)
      o.connect(g).connect(ac.destination)
      o.start(ac.currentTime + t)
      o.stop(ac.currentTime + t + 0.2)
    })
    navigator.vibrate?.([200, 100, 200])
  } catch {
    /* audio not available */
  }
}

/** Timestamp-based rest timer, so it stays right if the phone locks mid-rest. */
export function RestTimerProvider({ children }: { children: ReactNode }) {
  const [endAt, setEndAt] = useState<number | null>(null)
  const [label, setLabel] = useState('')
  const [now, setNow] = useState(Date.now())
  const fired = useRef(false)

  const start = useCallback((seconds: number, l: string) => {
    fired.current = false
    setLabel(l)
    setEndAt(Date.now() + seconds * 1000)
  }, [])

  useEffect(() => {
    if (endAt == null) return
    const id = setInterval(() => setNow(Date.now()), 250)
    return () => clearInterval(id)
  }, [endAt])

  const left = endAt == null ? 0 : Math.ceil((endAt - now) / 1000)
  useEffect(() => {
    if (endAt != null && left <= 0 && !fired.current) {
      fired.current = true
      beep()
    }
  }, [left, endAt])

  const mm = Math.floor(Math.max(0, left) / 60)
  const ss = String(Math.max(0, left) % 60).padStart(2, '0')
  return (
    <Ctx.Provider value={{ start }}>
      {children}
      {endAt != null && (
        <div className="fixed inset-x-0 bottom-[calc(4rem+env(safe-area-inset-bottom))] z-30 px-3 pb-2">
          <div className={`mx-auto flex max-w-lg items-center gap-2 rounded-2xl p-2 pl-4 text-white shadow-lg ${left <= 0 ? 'bg-emerald-600' : 'bg-slate-900 dark:bg-slate-700'}`}>
            <div className="flex-1">
              <div className="text-xs opacity-80">{left <= 0 ? 'Rest over: next set' : `Rest · ${label}`}</div>
              <div className="tabular text-3xl font-bold leading-none">{mm}:{ss}</div>
            </div>
            <button type="button" className="h-12 w-14 rounded-xl bg-white/15 font-semibold" onClick={() => setEndAt((e) => (e ?? Date.now()) - 15000)}>−15</button>
            <button type="button" className="h-12 w-14 rounded-xl bg-white/15 font-semibold" onClick={() => { fired.current = false; setEndAt((e) => Math.max(e ?? 0, Date.now()) + 15000) }}>+15</button>
            <button type="button" className="h-12 w-16 rounded-xl bg-white/25 font-semibold" onClick={() => setEndAt(null)}>{left <= 0 ? 'Close' : 'Skip'}</button>
          </div>
        </div>
      )}
    </Ctx.Provider>
  )
}
