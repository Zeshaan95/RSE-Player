import { useMemo, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { CartesianGrid, ComposedChart, Legend, Line, LineChart, ReferenceArea, ReferenceDot, ReferenceLine, ResponsiveContainer, Scatter, Tooltip, XAxis, YAxis } from 'recharts'
import { db } from '../db/db'
import { useDaily, useMaxes, useToday, useWorkouts } from '../hooks'
import { dayNum, fmtDate, fmtShort, fromDayNum } from '../lib/dates'
import { projection, sevenDayAvg, targetFor } from '../lib/weight'
import { best1RM, exerciseHistory, topSetKg } from '../lib/strength'
import { EXERCISES, FESTIVE, GOAL, PULLUP_BASELINE_MAX, TARGET_PATH } from '../plan'
import { fmtStLb } from '../lib/units'
import { Card, PageHeader } from '../components/ui'
import { useChartTheme } from '../components/chartTheme'

interface Row {
  x: number
  date: string
  reading?: number
  avg?: number
  target?: number
}

function WeightTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: Row }> }) {
  if (!active || !payload?.length) return null
  const r = payload[0].payload
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs shadow dark:border-slate-700 dark:bg-slate-900">
      <div className="mb-1 font-semibold">{fmtDate(r.date)}</div>
      {r.reading != null && <div className="tabular">Reading: <b>{r.reading.toFixed(2)} kg</b></div>}
      {r.avg != null && <div className="tabular">7-day avg: <b>{r.avg.toFixed(2)} kg</b></div>}
      {r.target != null && <div className="tabular">Target: <b>{r.target.toFixed(2)} kg</b></div>}
    </div>
  )
}

function WeightChart() {
  const daily = useDaily()
  const today = useToday()
  const t = useChartTheme()
  const [range, setRange] = useState<'plan' | '4w'>('plan')

  const rows = useMemo(() => {
    const lastData = [...daily.keys()].at(-1) ?? GOAL.startDate
    const end = [TARGET_PATH.at(-1)!.date, lastData, today].sort().at(-1)!
    const out: Row[] = []
    for (let n = dayNum(GOAL.startDate); n <= dayNum(end); n++) {
      const date = fromDayNum(n)
      out.push({ x: n, date, reading: daily.get(date), avg: sevenDayAvg(daily, date) ?? undefined, target: targetFor(date) ?? undefined })
    }
    return out
  }, [daily, today])

  const from = range === 'plan' ? dayNum(GOAL.startDate) : dayNum(today) - 27
  const to = range === 'plan' ? rows.at(-1)!.x : dayNum(today) + 1
  const visible = rows.filter((r) => r.x >= from && r.x <= to)
  const vals = visible.flatMap((r) => [r.reading, r.avg, r.target]).filter((v): v is number => v != null)
  const yMin = Math.floor(Math.min(...vals, range === 'plan' ? 82.5 : Infinity))
  const yMax = Math.ceil(Math.max(...vals))
  const step = yMax - yMin > 8 ? 2 : 1
  const yTicks = Array.from({ length: Math.floor((yMax - yMin) / step) + 1 }, (_, i) => yMin + i * step)
  const ticks = range === 'plan' ? ['2026-10-18', '2026-11-08', '2026-11-29', '2026-12-20', '2027-01-10', '2027-01-31'].map(dayNum) : undefined

  return (
    <Card
      title="Weight"
      action={
        <div className="flex rounded-lg bg-slate-100 p-0.5 text-sm dark:bg-slate-800">
          {(['plan', '4w'] as const).map((r) => (
            <button key={r} type="button" onClick={() => setRange(r)} className={`min-h-9 rounded-md px-3 font-medium ${range === r ? 'bg-white shadow dark:bg-slate-950' : 'text-slate-500'}`}>
              {r === 'plan' ? 'Whole plan' : '4 weeks'}
            </button>
          ))}
        </div>
      }
    >
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={visible} margin={{ top: 8, right: 8, bottom: 0, left: -18 }}>
            <CartesianGrid stroke={t.grid} vertical={false} />
            <ReferenceArea x1={dayNum(FESTIVE.start)} x2={dayNum(FESTIVE.end)} fill={t.shade} fillOpacity={0.08} ifOverflow="hidden" />
            <XAxis dataKey="x" type="number" domain={[from, to]} ticks={ticks} tickFormatter={(n) => fmtShort(fromDayNum(n))} tick={{ fill: t.axis, fontSize: 11 }} stroke={t.grid} allowDataOverflow />
            <YAxis domain={[yMin, yMax]} ticks={yTicks} tick={{ fill: t.axis, fontSize: 11 }} stroke={t.grid} allowDecimals={false} />
            <Tooltip content={<WeightTooltip />} cursor={{ stroke: t.axis, strokeDasharray: '3 3' }} />
            <Legend wrapperStyle={{ fontSize: 12 }} iconSize={10} formatter={(v) => <span style={{ color: t.text }}>{v}</span>} />
            {GOAL.milestones.map((m) => (
              <ReferenceLine key={m.id} y={m.kg} stroke={t.axis} strokeDasharray="2 4" ifOverflow="extendDomain" label={{ value: `${m.label} ${m.kg}`, position: 'insideBottomLeft', fill: t.axis, fontSize: 10 }} />
            ))}
            {GOAL.milestones.map((m) => (
              <ReferenceDot key={m.id + 'd'} x={dayNum(m.date)} y={m.kg} r={5} fill={t.secondary} stroke={t.surface} strokeWidth={2} ifOverflow="hidden" />
            ))}
            <Line name="Target path" dataKey="target" stroke={t.secondary} strokeWidth={2} strokeDasharray="6 4" dot={false} connectNulls={false} isAnimationActive={false} />
            <Line name="7-day average" dataKey="avg" stroke={t.primary} strokeWidth={2.5} dot={false} connectNulls={false} isAnimationActive={false} />
            <Scatter name="Daily reading" dataKey="reading" fill={t.dots} shape="circle" isAnimationActive={false} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      <p className="mt-1 text-xs text-slate-500">Shaded: festive fortnight (19 Dec – 1 Jan). Orange dots: 1.5 st (1 Jan) and 2 st (31 Jan) milestones.</p>
      <details className="mt-2 text-sm">
        <summary className="cursor-pointer text-brand-700 dark:text-brand-500">Show as table</summary>
        <table className="tabular mt-2 w-full text-left text-xs">
          <thead className="text-slate-500"><tr><th>Date</th><th>Reading</th><th>7-day avg</th><th>Target</th></tr></thead>
          <tbody>
            {rows.filter((r) => r.reading != null).reverse().map((r) => (
              <tr key={r.date} className="border-t border-slate-100 dark:border-slate-800">
                <td className="py-1">{fmtDate(r.date)}</td><td>{r.reading?.toFixed(2)}</td><td>{r.avg?.toFixed(2) ?? '—'}</td><td>{r.target?.toFixed(2) ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </Card>
  )
}

function ProjectionCard() {
  const daily = useDaily()
  const today = useToday()
  const p = projection(daily, today)
  return (
    <Card title="Projection · last 14 days">
      {!p ? (
        <p className="text-sm text-slate-500">Not enough data: needs at least 3 weigh-ins in the last 14 days.</p>
      ) : (
        <>
          <p className="tabular mb-3 text-sm">
            Trend: <b>{p.slopeKgPerWeek <= 0 ? `${(-p.slopeKgPerWeek).toFixed(2)} kg/week down` : `${p.slopeKgPerWeek.toFixed(2)} kg/week up`}</b> ({p.readings} readings)
          </p>
          <div className="grid grid-cols-2 gap-3">
            {GOAL.milestones.map((m) => {
              const d = p.dates[m.id]
              return (
                <div key={m.id} className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800/60">
                  <div className="text-xs text-slate-500">{m.label} · {m.kg} kg</div>
                  <div className="text-lg font-bold">{d === 'reached' ? 'Reached ✓' : d ? fmtDate(d) : 'No date: trend not downwards'}</div>
                  <div className="text-xs text-slate-500">Plan: {fmtDate(m.date)}{d && d !== 'reached' ? (d <= m.date ? ' · on schedule' : ' · later than plan') : ''}</div>
                </div>
              )
            })}
          </div>
        </>
      )}
    </Card>
  )
}

function StrengthChart() {
  const workouts = useWorkouts()
  const t = useChartTheme()
  const loaded = Object.values(EXERCISES).filter((e) => !e.bodyweight)
  const [exId, setExId] = useState(loaded[0].id)
  const data = exerciseHistory(workouts, exId).map((h) => ({ date: h.date, top: topSetKg(h.log), e1rm: best1RM(h.log) }))
  return (
    <Card title="Strength">
      <select value={exId} onChange={(e) => setExId(e.target.value)} className="mb-3 h-12 w-full rounded-xl border border-slate-300 bg-white px-3 font-semibold dark:border-slate-700 dark:bg-slate-950">
        {loaded.map((e) => (
          <option key={e.id} value={e.id}>{e.name}{e.compound ? ' (compound)' : ''}</option>
        ))}
      </select>
      {data.length === 0 ? (
        <p className="text-sm text-slate-500">No completed sessions with this exercise yet.</p>
      ) : (
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -18 }}>
              <CartesianGrid stroke={t.grid} vertical={false} />
              <XAxis dataKey="date" tickFormatter={fmtShort} tick={{ fill: t.axis, fontSize: 11 }} stroke={t.grid} />
              <YAxis tick={{ fill: t.axis, fontSize: 11 }} stroke={t.grid} domain={['dataMin - 5', 'dataMax + 5']} allowDecimals={false} />
              <Tooltip labelFormatter={(d) => fmtDate(String(d))} formatter={(v) => `${Number(v).toFixed(1)} kg`} contentStyle={{ background: t.surface, borderColor: t.grid, fontSize: 12, color: t.text }} />
              <Legend wrapperStyle={{ fontSize: 12 }} iconSize={10} formatter={(v) => <span style={{ color: t.text }}>{v}</span>} />
              <Line name="Top set" dataKey="top" stroke={t.primary} strokeWidth={2} dot={{ r: 4, strokeWidth: 2, stroke: t.surface, fill: t.primary }} isAnimationActive={false} />
              <Line name="Est. 1RM (Epley)" dataKey="e1rm" stroke={t.secondary} strokeWidth={2} strokeDasharray="6 4" dot={{ r: 4, strokeWidth: 2, stroke: t.surface, fill: t.secondary }} isAnimationActive={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </Card>
  )
}

function PullupHistory() {
  const tests = useLiveQuery(() => db.maxTests.where('test').equals('pullup').sortBy('date'), []) ?? []
  const maxes = useMaxes()
  const t = useChartTheme()
  const data = [{ date: 'Before', reps: PULLUP_BASELINE_MAX }, ...tests.map((x) => ({ date: fmtShort(x.date), reps: x.reps }))]
  return (
    <Card title="Pull-up max tests">
      <p className="mb-2 text-sm">Current max: <b className="tabular">{maxes.pullup}</b> strict reps · working sets {Math.max(1, (maxes.pullup ?? 1) - 1)} reps. Test days: Sun 22 Nov and Sun 27 Dec.</p>
      <div className="h-40">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -24 }}>
            <CartesianGrid stroke={t.grid} vertical={false} />
            <XAxis dataKey="date" tick={{ fill: t.axis, fontSize: 11 }} stroke={t.grid} />
            <YAxis allowDecimals={false} tick={{ fill: t.axis, fontSize: 11 }} stroke={t.grid} domain={[0, 'dataMax + 2']} />
            <Tooltip formatter={(v) => `${v} reps`} contentStyle={{ background: t.surface, borderColor: t.grid, fontSize: 12, color: t.text }} />
            <Line dataKey="reps" name="Max reps" stroke={t.primary} strokeWidth={2} dot={{ r: 5, strokeWidth: 2, stroke: t.surface, fill: t.primary }} isAnimationActive={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <ul className="mt-2 text-sm">
        <li className="tabular flex justify-between border-t border-slate-100 py-1.5 dark:border-slate-800"><span>Previous best</span><b>{PULLUP_BASELINE_MAX}</b></li>
        {tests.map((x) => (
          <li key={x.id} className="tabular flex justify-between border-t border-slate-100 py-1.5 dark:border-slate-800"><span>{fmtDate(x.date)}</span><b>{x.reps}</b></li>
        ))}
      </ul>
    </Card>
  )
}

export default function Progress() {
  const daily = useDaily()
  const first = daily.get(GOAL.startDate) ?? GOAL.startKg
  const last = [...daily.values()].at(-1)
  return (
    <div className="space-y-3">
      <PageHeader title="Progress" right={last != null ? <span className="tabular text-sm text-slate-500">{(first - last >= 0 ? '−' : '+') + Math.abs(first - last).toFixed(1)} kg · {fmtStLb(Math.abs(first - last))} since 18 Oct</span> : undefined} />
      <WeightChart />
      <ProjectionCard />
      <StrengthChart />
      <PullupHistory />
    </div>
  )
}
