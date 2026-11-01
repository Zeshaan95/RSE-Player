import { useState } from 'react'
import { db } from '../db/db'
import { nowTime, todayISO } from '../lib/dates'
import { fmtStLb } from '../lib/units'
import { Button, NumberField, parseNum } from './ui'
import type { WeighIn } from '../db/types'

export function validKg(n: number | null): n is number {
  return n != null && n >= 30 && n <= 250
}

/** Quick weigh-in: type the number, tap Save. Date/time default to now. */
export function QuickWeighIn({ date, onSaved }: { date?: string; onSaved?: (w: WeighIn) => void }) {
  const [text, setText] = useState('')
  const [saved, setSaved] = useState<string | null>(null)
  const kg = parseNum(text)
  const ok = validKg(kg)
  const save = async () => {
    if (!ok) return
    const w: WeighIn = { date: date ?? todayISO(), time: nowTime(), kg: Math.round(kg * 100) / 100 }
    await db.weighIns.add(w)
    setText('')
    setSaved(`Saved ${w.kg.toFixed(2)} kg`)
    setTimeout(() => setSaved(null), 2500)
    onSaved?.(w)
  }
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        save()
      }}
      className="flex items-end gap-2"
    >
      <NumberField
        className="flex-1"
        label={saved ?? (ok ? fmtStLb(kg) : 'Weight')}
        suffix="kg"
        placeholder="96.20"
        value={text}
        onChange={(e) => setText(e.target.value)}
        enterKeyHint="done"
        aria-label="Weight in kg"
      />
      <Button type="submit" disabled={!ok} className="h-12 px-6">
        Save
      </Button>
    </form>
  )
}
