import { useLiveQuery } from 'dexie-react-hooks'
import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { db } from '../db/db'
import type { ExerciseLog, SetEntry, Workout as WorkoutT } from '../db/types'
import { useMaxes, useSettings, useToday, useWorkouts } from '../hooks'
import { fmtDate, fmtDateDay, fmtShort } from '../lib/dates'
import { sessionFor } from '../lib/schedule'
import {
  exerciseHistory,
  newWorkout,
  progression,
  repLabel,
  restSecondsFor,
  setsFor,
  strengthWarning,
  topSetKg,
  WARNING_TEXT,
  type Maxes,
} from '../lib/strength'
import { EXERCISES, SESSION_RULES, TEMPLATES, type TemplateId } from '../plan'
import { Button, Card, PageHeader, parseNum } from '../components/ui'
import { useRestTimer } from '../components/RestTimer'
import { saveHabit } from '../components/HabitForm'

function fmtSet(s: SetEntry, bodyweight: boolean) {
  if (bodyweight) return `${s.reps}${s.kg ? ` +${s.kg}` : ''}`
  return `${s.kg ?? '?'}×${s.reps}`
}

function lastSummary(log: ExerciseLog, bodyweight: boolean) {
  return log.sets.filter((s) => !s.warmup && s.reps).map((s) => fmtSet(s, bodyweight)).join(', ')
}

function CellInput({ value, onChange, placeholder, label }: { value: number | null; onChange: (v: number | null) => void; placeholder: string; label: string }) {
  const [text, setText] = useState(value?.toString() ?? '')
  useEffect(() => {
    if (parseNum(text) !== value) setText(value?.toString() ?? '')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])
  return (
    <input
      aria-label={label}
      type="text"
      inputMode="decimal"
      value={text}
      placeholder={placeholder}
      onFocus={(e) => e.target.select()}
      onChange={(e) => {
        setText(e.target.value)
        onChange(parseNum(e.target.value))
      }}
      className="tabular h-12 w-full min-w-0 rounded-lg border border-slate-300 bg-white text-center text-lg font-semibold outline-none focus:border-brand-600 dark:border-slate-700 dark:bg-slate-950"
    />
  )
}

function ExerciseCard({ w, idx, all, maxes }: { w: WorkoutT; idx: number; all: WorkoutT[]; maxes: Maxes }) {
  const log = w.exercises[idx]
  const ex = EXERCISES[log.exerciseId]
  const timer = useRestTimer()
  const history = exerciseHistory(all, ex.id, { excludeId: w.id }).filter((h) => h.date <= w.date)
  const last = history.at(-1)
  const prog = progression(ex, w.template, last?.log)
  const warn = ex.compound && strengthWarning(history.map((h) => topSetKg(h.log)))
  const rest = restSecondsFor(ex)

  // Read-modify-write against the stored record so quick edits across fields never clobber each other.
  const mutate = (fn: (sets: SetEntry[]) => SetEntry[]) =>
    db.transaction('rw', db.workouts, async () => {
      const cur = await db.workouts.get(w.id!)
      if (!cur) return
      const exercises = cur.exercises.map((e, i) => (i === idx ? { ...e, sets: fn(e.sets) } : e))
      await db.workouts.update(w.id!, { exercises })
    })
  const update = (sets: SetEntry[]) => mutate(() => sets)
  const setField = (i: number, patch: Partial<SetEntry>) => mutate((sets) => sets.map((s, j) => (j === i ? { ...s, ...patch } : s)))
  let working = 0

  return (
    <Card>
      <div className="mb-2 flex items-start justify-between gap-2">
        <div>
          <h3 className="text-lg font-bold leading-tight">{ex.name}</h3>
          <div className="text-sm text-slate-600 dark:text-slate-300">
            {setsFor(w.template, ex.id)} × {repLabel(ex, maxes)}
            {ex.bodyweight && ' · bodyweight'} · rest {ex.compound ? '2–3 min' : '60–90 s'}
          </div>
          <div className="text-xs text-slate-500">{ex.compound ? `Compound: ${SESSION_RULES.effortCompound.toLowerCase()}` : SESSION_RULES.effortAccessory}{ex.note ? ` · ${ex.note}` : ''}</div>
        </div>
        {prog && <span className="shrink-0 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-bold text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300">▲ +{prog.addKg} kg</span>}
      </div>
      <div className="mb-2 rounded-lg bg-slate-50 px-3 py-2 text-sm dark:bg-slate-800/60">
        {last ? (
          <>
            <span className="text-slate-500">Last time ({fmtShort(last.date)}): </span>
            <span className="tabular font-semibold">{lastSummary(last.log, ex.bodyweight)}</span>
          </>
        ) : (
          <span className="text-slate-500">No previous session logged</span>
        )}
        {prog && <div className="mt-1 font-semibold text-emerald-700 dark:text-emerald-400">{prog.message}</div>}
        {warn && <div className="mt-1 font-semibold text-amber-700 dark:text-amber-400">⚠️ Top set down two sessions in a row: {WARNING_TEXT.toLowerCase()}</div>}
      </div>

      <div className="grid grid-cols-[2.5rem_1fr_1fr_3.5rem] items-center gap-2 text-xs font-medium text-slate-500">
        <span>Set</span>
        <span className="text-center">{ex.bodyweight ? '+kg' : 'kg'}</span>
        <span className="text-center">Reps</span>
        <span />
      </div>
      <ul className="mt-1 space-y-2">
        {log.sets.map((s, i) => {
          if (!s.warmup) working++
          return (
            <li key={i} className={`grid grid-cols-[2.5rem_1fr_1fr_3.5rem] items-center gap-2 ${s.done ? 'opacity-70' : ''}`}>
              <button
                type="button"
                className="h-12 text-left font-bold text-slate-500"
                onClick={() => {
                  if (confirm(`Remove ${s.warmup ? 'warm-up' : `set ${working}`}?`)) update(log.sets.filter((_, j) => j !== i))
                }}
                aria-label="Remove set"
              >
                {s.warmup ? 'W' : working}
              </button>
              <CellInput label="kg" value={s.kg} placeholder={ex.bodyweight ? 'BW' : 'kg'} onChange={(kg) => setField(i, { kg })} />
              <CellInput label="reps" value={s.reps} placeholder="reps" onChange={(reps) => setField(i, { reps: reps == null ? null : Math.round(reps) })} />
              <button
                type="button"
                aria-label="Set done"
                onClick={() => {
                  setField(i, { done: !s.done })
                  if (!s.done) timer.start(s.warmup ? 60 : rest, ex.name)
                }}
                className={`h-12 rounded-lg text-xl font-bold ${s.done ? 'bg-emerald-600 text-white' : 'bg-slate-200 dark:bg-slate-800'}`}
              >
                ✓
              </button>
            </li>
          )
        })}
      </ul>
      <div className="mt-2 flex gap-2">
        <Button variant="ghost" className="flex-1" onClick={() => update([...log.sets, { kg: log.sets.at(-1)?.kg ?? null, reps: null }])}>+ Set</Button>
        {idx === 0 && (
          <Button variant="ghost" className="flex-1" onClick={() => update([{ kg: null, reps: null, warmup: true }, ...log.sets])}>+ Warm-up</Button>
        )}
        <Button variant="ghost" className="flex-1" onClick={() => timer.start(rest, ex.name)}>⏱ {rest >= 120 ? `${rest / 60} min` : `${rest} s`}</Button>
      </div>
    </Card>
  )
}

function MaxTestCard({ date, test, title }: { date: string; test: 'pullup' | 'dips'; title: string }) {
  const existing = useLiveQuery(() => db.maxTests.where('date').equals(date).filter((t) => t.test === test).first(), [date, test])
  const [text, setText] = useState('')
  useEffect(() => setText(existing?.reps.toString() ?? ''), [existing])
  const save = async () => {
    const n = parseNum(text)
    if (n == null || n < 0) return
    if (existing?.id != null) await db.maxTests.update(existing.id, { reps: Math.round(n) })
    else await db.maxTests.add({ date, test, reps: Math.round(n) })
  }
  return (
    <div className="flex items-end gap-2">
      <label className="flex-1">
        <span className="mb-1 block text-xs font-medium text-slate-500">{title}</span>
        <input type="text" inputMode="numeric" value={text} onChange={(e) => setText(e.target.value)} placeholder="strict reps" className="tabular h-12 w-full rounded-xl border border-slate-300 bg-white px-3 text-lg font-semibold dark:border-slate-700 dark:bg-slate-950" />
      </label>
      <Button onClick={save}>{existing ? 'Update' : 'Save'}</Button>
    </div>
  )
}

function ActiveWorkout({ w, all, maxes }: { w: WorkoutT; all: WorkoutT[]; maxes: Maxes }) {
  const session = sessionFor(w.date)
  const isTestDay = w.template === 'B' && session.pullupTest
  const [showDipsTest, setShowDipsTest] = useState(false)
  const hasDips = w.exercises.some((e) => e.exerciseId === 'dips')
  const complete = async () => {
    await db.workouts.update(w.id!, { completed: true, completedAt: new Date().toISOString() })
    await saveHabit(w.date, { sessionDone: true })
  }
  return (
    <div className="space-y-3">
      <PageHeader title={TEMPLATES[w.template].name} right={<span className="text-sm text-slate-500">{fmtDateDay(w.date)}</span>} />
      {w.completed && <div className="rounded-xl bg-emerald-100 px-4 py-3 font-semibold text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">✓ Session complete. You can still edit it.</div>}
      <Card title="Warm-up · 8 min">
        <p className="text-sm">5 min on the bike or rower, then 2 lighter warm-up sets of {EXERCISES[w.exercises[0].exerciseId].name.toLowerCase()} (use “+ Warm-up”).</p>
      </Card>
      {isTestDay && (
        <Card title="Pull-up max test: do this first" className="border-2 border-amber-400">
          <p className="mb-2 text-sm">Strict reps only, before any other sets. Your working sets then use this max − 1.</p>
          <MaxTestCard date={w.date} test="pullup" title={`Max strict pull-ups (current max ${maxes.pullup ?? '—'})`} />
        </Card>
      )}
      {w.exercises.map((_, i) => (
        <ExerciseCard key={w.exercises[i].exerciseId + i} w={w} idx={i} all={all} maxes={maxes} />
      ))}
      {hasDips && (
        <Card title="Dips max test">
          {showDipsTest || maxes.dips == null ? (
            <MaxTestCard date={w.date} test="dips" title={`Max dips (current ${maxes.dips ?? 'not tested'})`} />
          ) : (
            <Button variant="ghost" onClick={() => setShowDipsTest(true)}>Log a new dips max (current {maxes.dips})</Button>
          )}
        </Card>
      )}
      {!w.completed ? (
        <Button className="w-full text-lg" onClick={complete}>Mark session complete</Button>
      ) : (
        <Button variant="secondary" className="w-full" onClick={() => db.workouts.update(w.id!, { completed: false, completedAt: undefined })}>Reopen session</Button>
      )}
      <Button
        variant="ghost"
        className="w-full text-rose-600"
        onClick={() => {
          if (confirm('Delete this session and all its sets?')) db.workouts.delete(w.id!)
        }}
      >
        Delete session
      </Button>
    </div>
  )
}

export default function Workout() {
  const today = useToday()
  const settings = useSettings()
  const all = useWorkouts()
  const maxes = useMaxes()
  const [params, setParams] = useSearchParams()
  const idParam = params.get('id')
  const session = sessionFor(today, { footballPaused: settings.footballPausedForHolidays })

  const todays = all.filter((w) => w.date === today).sort((a, b) => (b.id ?? 0) - (a.id ?? 0))
  const listMode = params.get('list') === '1'
  const current = listMode ? undefined : idParam ? all.find((w) => w.id === Number(idParam)) : todays.find((w) => !w.completed) ?? (session.template ? todays.find((w) => w.template === session.template) : undefined)

  const start = async (t: TemplateId) => {
    const w = newWorkout(t, today, await db.workouts.toArray(), new Date().toISOString())
    const id = await db.workouts.add(w)
    setParams({ id: String(id) })
  }

  // Deep link from Today: /workout?start=B opens today's session straight away.
  const startParam = params.get('start') as TemplateId | null
  const loaded = useLiveQuery(() => db.workouts.count(), [])
  const started = useRef(false)
  useEffect(() => {
    if (!startParam || loaded == null || started.current) return
    started.current = true
    const existing = todays.find((w) => w.template === startParam)
    if (existing) setParams({ id: String(existing.id) }, { replace: true })
    else start(startParam)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startParam, loaded])

  if (current) {
    return (
      <div>
        <button type="button" className="mt-2 min-h-11 text-brand-700 dark:text-brand-500" onClick={() => setParams({ list: '1' })}>‹ All workouts</button>
        <ActiveWorkout w={current} all={all} maxes={maxes} />
      </div>
    )
  }

  const past = [...all].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : (b.id ?? 0) - (a.id ?? 0)))
  return (
    <div className="space-y-3">
      <PageHeader title="Workout" />
      <Card title={`Today · ${fmtDate(today)}`}>
        <p className="mb-3 font-semibold">{session.title}</p>
        {session.template ? (
          <Button className="w-full text-lg" onClick={() => start(session.template!)}>Start Strength {session.template}</Button>
        ) : (
          <p className="text-sm text-slate-500">No gym session scheduled today. You can still start one:</p>
        )}
        <div className="mt-2 grid grid-cols-3 gap-2">
          {(['A', 'B', 'C'] as TemplateId[]).filter((t) => t !== session.template).map((t) => (
            <Button key={t} variant="secondary" onClick={() => start(t)}>Start {t}</Button>
          ))}
        </div>
      </Card>
      <Card title="History">
        {past.length === 0 && <p className="text-sm text-slate-500">No sessions logged yet.</p>}
        <ul className="divide-y divide-slate-100 dark:divide-slate-800">
          {past.map((w) => (
            <li key={w.id}>
              <button type="button" className="flex min-h-14 w-full items-center gap-2 py-2 text-left" onClick={() => setParams({ id: String(w.id) })}>
                <span className="flex-1">
                  <span className="block font-semibold">{TEMPLATES[w.template].name}</span>
                  <span className="block text-xs text-slate-500">{fmtDateDay(w.date)}</span>
                </span>
                <span className={`text-xs font-semibold ${w.completed ? 'text-emerald-600' : 'text-amber-600'}`}>{w.completed ? 'Complete' : 'In progress'}</span>
                <span className="text-slate-400">›</span>
              </button>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  )
}
