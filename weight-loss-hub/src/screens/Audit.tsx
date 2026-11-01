import { useLiveQuery } from 'dexie-react-hooks'
import { useState } from 'react'
import { db } from '../db/db'
import { updateSettings, useSettings, useToday } from '../hooks'
import { addDays, fmtDate, fmtDateDay } from '../lib/dates'
import { AUDIT } from '../plan'
import { Button, Card, NumberField, PageHeader, TextField, parseNum } from '../components/ui'
import type { AuditEntry } from '../db/types'

function Totals({ entries, kcalTarget, proteinMin }: { entries: AuditEntry[]; kcalTarget: number; proteinMin: number }) {
  const kcal = entries.reduce((s, e) => s + e.kcal, 0)
  const protein = entries.reduce((s, e) => s + e.protein, 0)
  const over = kcal - kcalTarget
  return (
    <div className="tabular grid grid-cols-2 gap-2 rounded-xl bg-slate-50 p-3 dark:bg-slate-800/60">
      <div>
        <div className="text-xs text-slate-500">Calories / {kcalTarget.toLocaleString('en-GB')}</div>
        <div className={`text-2xl font-bold ${over > 0 ? 'text-amber-700 dark:text-amber-400' : ''}`}>{kcal.toLocaleString('en-GB')}</div>
        <div className="text-xs text-slate-500">{over > 0 ? `${over} over` : `${-over} left`}</div>
      </div>
      <div>
        <div className="text-xs text-slate-500">Protein / {proteinMin} g</div>
        <div className="text-2xl font-bold">{protein} g</div>
        <div className="text-xs text-slate-500">{protein >= proteinMin ? 'Target met' : `${proteinMin - protein} g to go`}</div>
      </div>
    </div>
  )
}

function AddEntry({ date }: { date: string }) {
  const [meal, setMeal] = useState('')
  const [kcal, setKcal] = useState('')
  const [protein, setProtein] = useState('')
  const k = parseNum(kcal)
  const add = async () => {
    if (!meal.trim() || k == null) return
    await db.auditEntries.add({ date, meal: meal.trim(), kcal: Math.round(k), protein: Math.round(parseNum(protein) ?? 0) })
    setMeal(''); setKcal(''); setProtein('')
  }
  return (
    <form className="space-y-2" onSubmit={(e) => { e.preventDefault(); add() }}>
      <TextField placeholder="Meal or item" value={meal} onChange={(e) => setMeal(e.target.value)} aria-label="Meal" />
      <div className="grid grid-cols-[1fr_1fr_auto] gap-2">
        <NumberField placeholder="kcal" suffix="kcal" value={kcal} onChange={(e) => setKcal(e.target.value)} aria-label="kcal" />
        <NumberField placeholder="protein" suffix="g" value={protein} onChange={(e) => setProtein(e.target.value)} aria-label="protein" />
        <Button type="submit" disabled={!meal.trim() || k == null}>Add</Button>
      </div>
      <Button variant="secondary" className="w-full" onClick={() => db.auditEntries.add({ date, meal: 'Oil or ghee (1 tbsp)', kcal: AUDIT.oilTbspKcal, protein: 0 })}>
        + Oil or ghee, 1 tbsp (≈{AUDIT.oilTbspKcal} kcal)
      </Button>
    </form>
  )
}

export default function Audit() {
  const today = useToday()
  const settings = useSettings()
  const entries = useLiveQuery(() => db.auditEntries.orderBy('date').toArray(), []) ?? []
  const start = settings.auditStart
  const days = start ? Array.from({ length: AUDIT.days }, (_, i) => addDays(start, i)) : []
  const [open, setOpen] = useState<string | null>(null)
  const activeDay = open ?? (days.includes(today) ? today : days[0])
  const past = entries.filter((e) => !days.includes(e.date))
  const pastDates = [...new Set(past.map((e) => e.date))].reverse()

  return (
    <div className="space-y-3">
      <PageHeader title="Food audit" />
      {!start ? (
        <Card>
          <p className="mb-3 text-sm">Weigh and log everything you eat and drink for {AUDIT.days} days to find hidden calories. Daily totals are shown against your {settings.kcalTarget.toLocaleString('en-GB')} kcal and {settings.proteinMin} g protein targets.</p>
          <Button className="w-full" onClick={() => updateSettings({ auditStart: today })}>Start 3-day audit today</Button>
          <Button variant="secondary" className="mt-2 w-full" onClick={() => updateSettings({ auditStart: addDays(today, 1) })}>Start tomorrow</Button>
        </Card>
      ) : (
        <>
          <Card title={`Audit · ${fmtDate(days[0])} – ${fmtDate(days[2])}`}>
            <div className="grid grid-cols-3 gap-2">
              {days.map((d, i) => {
                const kcal = entries.filter((e) => e.date === d).reduce((s, e) => s + e.kcal, 0)
                return (
                  <button key={d} type="button" onClick={() => setOpen(d)} className={`rounded-xl p-2 text-center ${d === activeDay ? 'bg-brand-700 text-white' : 'bg-slate-100 dark:bg-slate-800'}`}>
                    <div className="text-xs opacity-80">Day {i + 1}</div>
                    <div className="text-sm font-semibold">{fmtDate(d).slice(0, -5)}</div>
                    <div className="tabular text-xs">{kcal ? `${kcal.toLocaleString('en-GB')} kcal` : '—'}</div>
                  </button>
                )
              })}
            </div>
          </Card>
          <Card title={fmtDateDay(activeDay)}>
            <Totals entries={entries.filter((e) => e.date === activeDay)} kcalTarget={settings.kcalTarget} proteinMin={settings.proteinMin} />
            <ul className="my-3 divide-y divide-slate-100 dark:divide-slate-800">
              {entries.filter((e) => e.date === activeDay).map((e) => (
                <li key={e.id} className="flex min-h-12 items-center gap-2">
                  <span className="flex-1">{e.meal}</span>
                  <span className="tabular text-sm">{e.kcal} kcal · {e.protein} g</span>
                  <button type="button" aria-label="Delete" className="h-11 w-11 text-rose-600" onClick={() => db.auditEntries.delete(e.id!)}>✕</button>
                </li>
              ))}
            </ul>
            <AddEntry date={activeDay} />
          </Card>
          <Button variant="secondary" className="w-full" onClick={() => { if (confirm('Finish this audit? Entries are kept.')) updateSettings({ auditStart: undefined }) }}>Finish audit</Button>
        </>
      )}
      {pastDates.length > 0 && (
        <Card title="Earlier audit days">
          <ul className="divide-y divide-slate-100 text-sm dark:divide-slate-800">
            {pastDates.map((d) => {
              const es = past.filter((e) => e.date === d)
              return (
                <li key={d} className="tabular flex min-h-11 items-center justify-between">
                  <span>{fmtDateDay(d)}</span>
                  <span>{es.reduce((s, e) => s + e.kcal, 0).toLocaleString('en-GB')} kcal · {es.reduce((s, e) => s + e.protein, 0)} g</span>
                </li>
              )
            })}
          </ul>
        </Card>
      )}
    </div>
  )
}
