import { useLiveQuery } from 'dexie-react-hooks'
import { useEffect, useState } from 'react'
import { db } from '../db/db'
import type { HabitDay, Settings } from '../db/types'
import { habitChecks, type HabitKey } from '../lib/habits'
import type { ISODate } from '../plan'
import { parseNum } from './ui'

const NUM_FIELDS: Array<{ key: HabitKey; field: keyof HabitDay; unit: string; step?: number }> = [
  { key: 'kcal', field: 'kcal', unit: 'kcal' },
  { key: 'protein', field: 'protein', unit: 'g' },
  { key: 'steps', field: 'steps', unit: 'steps' },
  { key: 'water', field: 'waterL', unit: 'L' },
  { key: 'sleep', field: 'sleepH', unit: 'h' },
]

export async function saveHabit(date: ISODate, patch: Partial<HabitDay>) {
  const cur = (await db.habits.get(date)) ?? { date }
  await db.habits.put({ ...cur, ...patch, date })
}

function NumHabit({ value, onSave, unit }: { value: number | undefined; onSave: (v: number | undefined) => void; unit: string }) {
  const [text, setText] = useState(value?.toString() ?? '')
  useEffect(() => setText(value?.toString() ?? ''), [value])
  return (
    <span className="relative block w-32">
      <input
        type="text"
        inputMode="decimal"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onBlur={() => {
          const n = parseNum(text)
          if (n !== (value ?? null)) onSave(n ?? undefined)
        }}
        onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
        className="tabular h-11 w-full rounded-lg border border-slate-300 bg-white pl-2 pr-10 text-right font-semibold outline-none focus:border-brand-600 dark:border-slate-700 dark:bg-slate-950"
        placeholder="—"
      />
      <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-xs text-slate-400">{unit}</span>
    </span>
  )
}

/** Today's habit checklist: numbers or ticks, saved as you go. */
export function HabitForm({ date, settings }: { date: ISODate; settings: Settings }) {
  const day = useLiveQuery(() => db.habits.get(date), [date])
  const checks = habitChecks(day, date, settings)
  return (
    <ul className="divide-y divide-slate-100 dark:divide-slate-800">
      {checks.map((c) => {
        const num = NUM_FIELDS.find((n) => n.key === c.key)
        const toggleField: keyof HabitDay | null = c.key === 'session' ? 'sessionDone' : c.key === 'creatine' ? 'creatine' : null
        return (
          <li key={c.key} className={`flex min-h-14 items-center gap-3 py-1.5 ${c.applicable ? '' : 'opacity-50'}`}>
            <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-bold ${c.met ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-400 dark:bg-slate-800'}`} aria-label={c.met ? 'met' : 'not met'}>
              {c.met ? '✓' : ''}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block font-medium">{c.label}</span>
              <span className="block text-xs text-slate-500 dark:text-slate-400">{c.target}</span>
            </span>
            {num && <NumHabit unit={num.unit} value={day?.[num.field] as number | undefined} onSave={(v) => saveHabit(date, { [num.field]: v })} />}
            {toggleField && (
              <button
                type="button"
                onClick={() => saveHabit(date, { [toggleField]: !day?.[toggleField] })}
                className={`h-11 w-32 rounded-lg font-semibold ${day?.[toggleField] ? 'bg-emerald-600 text-white' : 'bg-slate-200 dark:bg-slate-800'}`}
              >
                {day?.[toggleField] ? 'Done' : 'Tick'}
              </button>
            )}
          </li>
        )
      })}
    </ul>
  )
}
