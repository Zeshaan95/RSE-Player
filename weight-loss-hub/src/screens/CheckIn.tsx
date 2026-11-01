import { useLiveQuery } from 'dexie-react-hooks'
import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { db } from '../db/db'
import type { BodyComp } from '../db/types'
import { updateSettings, useDaily, useSettings, useToday, useWorkouts } from '../hooks'
import { addDays, fmtDate, fmtDateDay, weekday } from '../lib/dates'
import { isWaistSunday } from '../lib/schedule'
import { dec6Check, sevenDayAvg, statusFor, targetFor, weeklyLossRate } from '../lib/weight'
import { adjustmentAdvice, previousSunday, type AdviceAction } from '../lib/advice'
import { liftsGoingDown } from '../lib/strength'
import { fmtStLb } from '../lib/units'
import { DAILY, GOAL, RULES } from '../plan'
import { Button, Card, NumberField, PageHeader, Stat, StatusPill, parseNum } from '../components/ui'

const BODY_FIELDS: Array<{ key: keyof BodyComp; label: string; unit: string }> = [
  { key: 'weightKg', label: 'Weight', unit: 'kg' },
  { key: 'bmi', label: 'BMI', unit: '' },
  { key: 'bodyFatPct', label: 'Body fat', unit: '%' },
  { key: 'subcutaneousFatPct', label: 'Subcutaneous fat', unit: '%' },
  { key: 'visceralFat', label: 'Visceral fat', unit: '' },
  { key: 'muscleMassKg', label: 'Muscle mass', unit: 'kg' },
  { key: 'skeletalMusclePct', label: 'Skeletal muscle', unit: '%' },
  { key: 'boneMassKg', label: 'Bone mass', unit: 'kg' },
  { key: 'fatFreeMassKg', label: 'Fat-free mass', unit: 'kg' },
  { key: 'bmrKcal', label: 'BMR', unit: 'kcal' },
  { key: 'bodyWaterPct', label: 'Body water', unit: '%' },
  { key: 'proteinPct', label: 'Protein', unit: '%' },
  { key: 'metabolicAge', label: 'Metabolic age', unit: 'yrs' },
]

function actionLabel(a: AdviceAction): string {
  switch (a.type) {
    case 'addSteps': return `Apply: +${a.steps.toLocaleString('en-GB')} steps a day`
    case 'cutKcal': return `Apply: −${a.kcal} kcal (carbs or fat)`
    case 'addCarbs': return `Apply: +${a.kcal} kcal carbs`
    case 'foodAudit': return 'Start 3-day food audit'
  }
}

function lastSundayOnOrBefore(d: string) {
  return addDays(d, -weekday(d))
}

export default function CheckIn() {
  const today = useToday()
  const [date, setDate] = useState(() => lastSundayOnOrBefore(today))
  const daily = useDaily()
  const settings = useSettings()
  const workouts = useWorkouts()
  const navigate = useNavigate()
  const saved = useLiveQuery(() => db.checkIns.get(date), [date])
  const body = useLiveQuery(() => db.bodyComp.get(date), [date])
  const history = useLiveQuery(() => db.checkIns.orderBy('date').reverse().toArray(), []) ?? []
  const lastWaist = history.find((c) => c.waistCm != null && c.date < date)

  const [waist, setWaist] = useState('')
  const [notes, setNotes] = useState('')
  const [bodyText, setBodyText] = useState<Record<string, string>>({})
  const [flash, setFlash] = useState('')
  useEffect(() => {
    setWaist(saved?.waistCm?.toString() ?? '')
    setNotes(saved?.notes ?? '')
  }, [saved, date])
  useEffect(() => {
    setBodyText(Object.fromEntries(BODY_FIELDS.map((f) => [f.key, body?.[f.key]?.toString() ?? ''])))
  }, [body, date])

  const avg = sevenDayAvg(daily, date)
  const target = targetFor(date)
  const status = statusFor(avg, target)
  const rate = weeklyLossRate(daily, date)
  const prev = previousSunday(date)
  const advice = adjustmentAdvice({
    date,
    rate,
    prevRate: weeklyLossRate(daily, prev),
    liftsDown: liftsGoingDown(workouts, date),
    prevLiftsDown: liftsGoingDown(workouts, prev),
    kcalTarget: settings.kcalTarget,
  })
  const dec6 = date >= RULES.dec6CheckDate ? dec6Check(daily) : null
  const waistDue = isWaistSunday(date)
  const applied = saved?.applied ?? []

  const save = async () => {
    const bc: BodyComp = { date }
    let any = false
    for (const f of BODY_FIELDS) {
      const n = parseNum(bodyText[f.key] ?? '')
      if (n != null) {
        ;(bc as unknown as Record<string, number>)[f.key] = n
        any = true
      }
    }
    await db.transaction('rw', db.checkIns, db.bodyComp, async () => {
      await db.checkIns.put({ ...(saved ?? {}), date, waistCm: parseNum(waist) ?? undefined, notes: notes.trim() || undefined, applied, savedAt: new Date().toISOString() })
      if (any) await db.bodyComp.put(bc)
      else if (body) await db.bodyComp.delete(date)
    })
    setFlash('Check-in saved')
    setTimeout(() => setFlash(''), 2500)
  }

  const apply = async (a: AdviceAction) => {
    if (a.type === 'foodAudit') {
      await updateSettings({ auditStart: addDays(date, 1) })
      navigate('/audit')
      return
    }
    if (applied.includes(a.type)) return
    if (a.type === 'addSteps') await updateSettings({ stepsExtra: settings.stepsExtra + a.steps })
    if (a.type === 'cutKcal') await updateSettings({ kcalTarget: Math.max(DAILY.kcalFloor, settings.kcalTarget - a.kcal), carbsG: Math.max(0, settings.carbsG - Math.round(a.kcal / 4)) })
    if (a.type === 'addCarbs') await updateSettings({ kcalTarget: settings.kcalTarget + a.kcal, carbsG: settings.carbsG + Math.round(a.kcal / 4) })
    await db.checkIns.put({ ...(saved ?? { date, savedAt: new Date().toISOString() }), applied: [...applied, a.type] })
  }

  return (
    <div className="space-y-3">
      <PageHeader title="Weekly check-in" />
      <div className="flex items-center gap-2">
        <button type="button" className="h-11 w-11 rounded-full text-2xl active:bg-slate-200 dark:active:bg-slate-800" onClick={() => setDate(addDays(date, -7))} aria-label="Previous Sunday">‹</button>
        <div className="flex-1 text-center font-semibold">{fmtDateDay(date)}{saved ? ' · saved' : ''}</div>
        <button type="button" className="h-11 w-11 rounded-full text-2xl active:bg-slate-200 disabled:opacity-30 dark:active:bg-slate-800" disabled={addDays(date, 7) > today} onClick={() => setDate(addDays(date, 7))} aria-label="Next Sunday">›</button>
      </div>

      <Card title="Status" action={<StatusPill status={status} />}>
        <div className="grid grid-cols-2 gap-3">
          <Stat big label="7-day average" value={avg?.toFixed(1) ?? '—'} sub={avg != null ? fmtStLb(avg) : 'Not enough data'} />
          <Stat big label="Target" value={target?.toFixed(1) ?? '—'} sub={target != null ? `${avg != null ? `${(avg - target >= 0 ? '+' : '−') + Math.abs(avg - target).toFixed(1)} kg` : ''}` : 'Outside the plan'} />
        </div>
        <p className="tabular mt-3 text-sm">
          Weekly loss rate: <b>{rate == null ? 'not enough data' : `${rate.toFixed(2)} kg/week`}</b>
        </p>
      </Card>

      <Card title="Adjustment advice">
        <p className="text-lg font-bold">{advice.headline}</p>
        {advice.details.length > 0 && (
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
            {advice.details.map((d) => <li key={d}>{d}</li>)}
          </ul>
        )}
        {advice.actions.length > 0 && (
          <div className="mt-3 space-y-2">
            {advice.actions.map((a) => (
              <Button key={a.type} variant={applied.includes(a.type) ? 'secondary' : 'primary'} className="w-full" disabled={applied.includes(a.type)} onClick={() => apply(a)}>
                {applied.includes(a.type) ? `✓ Applied (${a.type === 'addSteps' ? 'steps' : 'calories'})` : actionLabel(a)}
              </Button>
            ))}
            <p className="text-xs text-slate-500">Current targets: {settings.kcalTarget.toLocaleString('en-GB')} kcal · +{settings.stepsExtra.toLocaleString('en-GB')} extra steps. Change them any time in Settings.</p>
          </div>
        )}
      </Card>

      {dec6 && (
        <Card title="6 Dec check" className={dec6.behind ? 'border border-amber-300 dark:border-amber-700' : ''}>
          <p className="tabular text-sm">6 Dec average {dec6.avg.toFixed(1)} kg vs target {dec6.target.toFixed(1)} kg ({dec6.gapKg >= 0 ? '+' : '−'}{Math.abs(dec6.gapKg).toFixed(1)} kg).</p>
          {dec6.behind ? (
            <>
              <p className="mt-2 font-bold">More than 2 kg behind: keep the same weekly pace and push the 2-stone date back.</p>
              <p className="tabular mt-1 text-sm">At the plan pace of {dec6.pacePerWeek.toFixed(2)} kg/week, the new 2-stone ({GOAL.milestones[1].kg} kg) date is <b>{fmtDate(dec6.newTwoStoneDate)}</b>.</p>
              <p className="mt-1 text-sm text-slate-500">Don’t cut harder.</p>
            </>
          ) : (
            <p className="mt-2 text-sm font-semibold">Within 2 kg of target: the 2-stone date stays 31 Jan 2027.</p>
          )}
        </Card>
      )}
      {!dec6 && date >= RULES.dec6CheckDate && <Card title="6 Dec check"><p className="text-sm text-slate-500">Not enough weigh-ins around 6 Dec to run the check.</p></Card>}

      <Card title="Measurements">
        {waistDue ? (
          <NumberField label={`Waist (due this Sunday)${lastWaist ? ` · last ${lastWaist.waistCm} cm on ${fmtDate(lastWaist.date)}` : ''}`} suffix="cm" value={waist} onChange={(e) => setWaist(e.target.value)} />
        ) : (
          <p className="text-sm text-slate-500">Waist is measured every other Sunday from 1 Nov. Next: {fmtDate(isWaistSunday(addDays(date, 7)) ? addDays(date, 7) : addDays(date, 14))}.{saved?.waistCm ? ` Logged: ${saved.waistCm} cm.` : ''}</p>
        )}
        <details className="mt-3">
          <summary className="min-h-11 cursor-pointer py-2 font-medium text-brand-700 dark:text-brand-500">Body composition (optional)</summary>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {BODY_FIELDS.map((f) => (
              <NumberField key={f.key} label={f.label} suffix={f.unit} value={bodyText[f.key] ?? ''} onChange={(e) => setBodyText({ ...bodyText, [f.key]: e.target.value })} />
            ))}
          </div>
        </details>
      </Card>

      <Card title="Notes">
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} className="w-full rounded-xl border border-slate-300 bg-white p-3 outline-none focus:border-brand-600 dark:border-slate-700 dark:bg-slate-950" placeholder="How did the week go?" />
      </Card>

      <Button className="w-full text-lg" onClick={save}>{flash || 'Save check-in'}</Button>

      {history.length > 0 && (
        <Card title="Past check-ins">
          <ul className="divide-y divide-slate-100 text-sm dark:divide-slate-800">
            {history.map((c) => {
              const a = sevenDayAvg(daily, c.date)
              return (
                <li key={c.date}>
                  <button type="button" className="flex min-h-12 w-full items-center gap-2 text-left" onClick={() => setDate(c.date)}>
                    <span className="flex-1">{fmtDate(c.date)}</span>
                    <span className="tabular">{a?.toFixed(1) ?? '—'} kg</span>
                    {c.waistCm && <span className="tabular text-slate-500">{c.waistCm} cm</span>}
                    <StatusPill status={statusFor(a, targetFor(c.date))} />
                  </button>
                </li>
              )
            })}
          </ul>
        </Card>
      )}
      <p className="text-center text-xs text-slate-500"><Link to="/progress" className="underline">See the full weight chart</Link></p>
    </div>
  )
}
