import { useLiveQuery } from 'dexie-react-hooks'
import { useState } from 'react'
import { db } from '../db/db'
import type { WeighIn } from '../db/types'
import { fmtDateDay, nowTime, todayISO } from '../lib/dates'
import { fmtStLb } from '../lib/units'
import { Button, Card, NumberField, PageHeader, TextField, parseNum } from '../components/ui'
import { validKg } from '../components/WeighInForm'

function WeighInEditor({ initial, onDone }: { initial?: WeighIn; onDone: () => void }) {
  const [kg, setKg] = useState(initial ? initial.kg.toFixed(2) : '')
  const [date, setDate] = useState(initial?.date ?? todayISO())
  const [time, setTime] = useState(initial?.time ?? nowTime())
  const n = parseNum(kg)
  const ok = validKg(n) && /^\d{4}-\d{2}-\d{2}$/.test(date) && /^\d{2}:\d{2}$/.test(time)
  const save = async () => {
    if (!ok) return
    const rec = { date, time, kg: Math.round(n * 100) / 100 }
    if (initial?.id != null) await db.weighIns.update(initial.id, rec)
    else await db.weighIns.add(rec)
    if (!initial) setKg('')
    onDone()
  }
  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault()
        save()
      }}
    >
      <NumberField label={validKg(n) ? `Weight · ${fmtStLb(n)}` : 'Weight (kg, 2 dp)'} suffix="kg" value={kg} onChange={(e) => setKg(e.target.value)} placeholder="96.20" />
      <div className="grid grid-cols-2 gap-2">
        <TextField label="Date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        <TextField label="Time" type="time" value={time} onChange={(e) => setTime(e.target.value)} />
      </div>
      <div className="flex gap-2">
        <Button type="submit" disabled={!ok} className="flex-1">
          {initial ? 'Save changes' : 'Add weigh-in'}
        </Button>
        {initial && (
          <Button variant="secondary" onClick={onDone}>
            Cancel
          </Button>
        )}
      </div>
    </form>
  )
}

export default function WeighIns() {
  const all = useLiveQuery(() => db.weighIns.toArray(), []) ?? []
  const [editing, setEditing] = useState<number | null>(null)
  const sorted = [...all].sort((a, b) => (a.date + a.time < b.date + b.time ? 1 : -1))

  return (
    <div className="space-y-3">
      <PageHeader title="Weigh-ins" />
      <Card title="Log a weigh-in">
        <WeighInEditor onDone={() => {}} />
      </Card>
      <Card title={`History (${all.length})`}>
        <ul className="divide-y divide-slate-100 dark:divide-slate-800">
          {sorted.map((w) =>
            editing === w.id ? (
              <li key={w.id} className="py-3">
                <WeighInEditor initial={w} onDone={() => setEditing(null)} />
              </li>
            ) : (
              <li key={w.id} className="flex items-center gap-2 py-2">
                <div className="min-w-0 flex-1">
                  <div className="tabular text-lg font-semibold">
                    {w.kg.toFixed(2)} kg <span className="text-sm font-normal text-slate-500">{fmtStLb(w.kg)}</span>
                  </div>
                  <div className="text-xs text-slate-500">
                    {fmtDateDay(w.date)} · {w.time}
                    {sorted.some((o) => o.date === w.date && o.time < w.time) ? ' · not counted (later reading)' : ''}
                  </div>
                </div>
                <Button variant="ghost" className="px-3" onClick={() => setEditing(w.id!)}>
                  Edit
                </Button>
                <Button
                  variant="ghost"
                  className="px-3 text-rose-600 dark:text-rose-400"
                  onClick={() => {
                    if (confirm(`Delete ${w.kg.toFixed(2)} kg on ${fmtDateDay(w.date)}?`)) db.weighIns.delete(w.id!)
                  }}
                >
                  Delete
                </Button>
              </li>
            ),
          )}
        </ul>
      </Card>
    </div>
  )
}
