import { useEffect, useRef, useState } from 'react'
import { db, ensureSeeded, requestPersistence } from '../db/db'
import { download, exportAll, importAll, liftsCsv, weighInsCsv } from '../db/backup'
import { updateSettings, useDaily, useSettings } from '../hooks'
import type { Settings } from '../db/types'
import { todayISO } from '../lib/dates'
import { DAILY } from '../plan'
import { Button, Card, NumberField, PageHeader, parseNum } from '../components/ui'

type NumKey = 'kcalTarget' | 'proteinMin' | 'proteinMax' | 'fatG' | 'carbsG' | 'fibreMinG' | 'stepsExtra' | 'waterMinL' | 'sleepMinH' | 'heightCm'
const FIELDS: Array<{ key: NumKey; label: string; suffix: string; min?: number }> = [
  { key: 'kcalTarget', label: 'Calories', suffix: 'kcal', min: DAILY.kcalFloor },
  { key: 'proteinMin', label: 'Protein min', suffix: 'g' },
  { key: 'proteinMax', label: 'Protein max', suffix: 'g' },
  { key: 'fatG', label: 'Fat', suffix: 'g' },
  { key: 'carbsG', label: 'Carbs', suffix: 'g' },
  { key: 'fibreMinG', label: 'Fibre min', suffix: 'g' },
  { key: 'stepsExtra', label: 'Extra steps (adjustments)', suffix: 'steps' },
  { key: 'waterMinL', label: 'Water min', suffix: 'L' },
  { key: 'sleepMinH', label: 'Sleep min', suffix: 'h' },
  { key: 'heightCm', label: 'Height', suffix: 'cm' },
]

function SettingNum({ s, f }: { s: Settings; f: (typeof FIELDS)[number] }) {
  const [text, setText] = useState(String(s[f.key]))
  const [err, setErr] = useState('')
  useEffect(() => setText(String(s[f.key])), [s, f.key])
  return (
    <div>
      <NumberField
        label={err || f.label}
        suffix={f.suffix}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onBlur={() => {
          const n = parseNum(text)
          if (n == null || n < 0) return setText(String(s[f.key]))
          if (f.min != null && n < f.min) {
            setErr(`Never below ${f.min.toLocaleString('en-GB')}`)
            setText(String(s[f.key]))
            return setTimeout(() => setErr(''), 3000)
          }
          updateSettings({ [f.key]: n })
        }}
      />
    </div>
  )
}

export default function SettingsScreen() {
  const s = useSettings()
  const daily = useDaily()
  const fileRef = useRef<HTMLInputElement>(null)
  const [persisted, setPersisted] = useState<boolean | null>(null)
  const [msg, setMsg] = useState('')
  useEffect(() => {
    navigator.storage?.persisted?.().then(setPersisted)
  }, [])
  const latest = [...daily.values()].at(-1)
  const bmi = latest ? latest / (s.heightCm / 100) ** 2 : null
  const stamp = todayISO()

  const flash = (m: string) => {
    setMsg(m)
    setTimeout(() => setMsg(''), 4000)
  }

  return (
    <div className="space-y-3">
      <PageHeader title="Settings" />
      {msg && <div className="rounded-xl bg-emerald-100 px-4 py-3 font-semibold text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">{msg}</div>}

      <Card title="Daily targets">
        <div className="grid grid-cols-2 gap-2">
          {FIELDS.filter((f) => f.key !== 'heightCm').map((f) => <SettingNum key={f.key} s={s} f={f} />)}
        </div>
        <p className="mt-2 text-xs text-slate-500">Plan defaults: {DAILY.kcal.toLocaleString('en-GB')} kcal (never below {DAILY.kcalFloor.toLocaleString('en-GB')}), {DAILY.proteinMin}–{DAILY.proteinMax} g protein, steps 10,000 until 8 Nov then 12,000 plus any extra steps above. Defaults live in <code>src/plan.ts</code>.</p>
      </Card>

      <Card title="Body">
        <SettingNum s={s} f={FIELDS.find((f) => f.key === 'heightCm')!} />
        {bmi && <p className="tabular mt-2 text-sm text-slate-500">BMI from latest weigh-in: {bmi.toFixed(1)}</p>}
      </Card>

      <Card title="Schedule">
        <label className="flex min-h-12 items-center justify-between gap-3">
          <span>
            <span className="block font-medium">Football paused for the holidays</span>
            <span className="block text-xs text-slate-500">Festive Thursdays become a 40-min jog or incline walk</span>
          </span>
          <input type="checkbox" className="h-6 w-6 accent-teal-700" checked={s.footballPausedForHolidays} onChange={(e) => updateSettings({ footballPausedForHolidays: e.target.checked })} />
        </label>
      </Card>

      <Card title="Appearance">
        <div className="grid grid-cols-3 gap-2">
          {(['system', 'light', 'dark'] as const).map((t) => (
            <Button key={t} variant={s.theme === t ? 'primary' : 'secondary'} onClick={() => updateSettings({ theme: t })}>{t[0].toUpperCase() + t.slice(1)}</Button>
          ))}
        </div>
      </Card>

      <Card title="Backup">
        <p className="mb-3 text-sm">
          Storage: {persisted ? '✓ persistent (the browser won’t clear it)' : persisted === false ? 'not persistent yet' : 'unknown'}.
          {!persisted && (
            <button type="button" className="ml-1 text-brand-700 underline dark:text-brand-500" onClick={async () => setPersisted(await requestPersistence())}>Request</button>
          )}
          {' '}On iPhone, adding the app to your Home Screen keeps its data safe. Export a backup regularly anyway.
        </p>
        <div className="space-y-2">
          <Button className="w-full" onClick={async () => { download(`weight-loss-hub-${stamp}.json`, JSON.stringify(await exportAll(db), null, 2), 'application/json'); flash('Backup exported') }}>Export everything (JSON)</Button>
          <Button variant="secondary" className="w-full" onClick={() => fileRef.current?.click()}>Import backup (JSON)</Button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={async (e) => {
              const file = e.target.files?.[0]
              e.target.value = ''
              if (!file) return
              if (!confirm('Import replaces ALL current data with the backup. Continue?')) return
              try {
                await importAll(db, JSON.parse(await file.text()))
                flash('Backup restored')
              } catch (err) {
                alert((err as Error).message || 'Import failed')
              }
            }}
          />
          <div className="grid grid-cols-2 gap-2">
            <Button variant="secondary" onClick={async () => download(`weigh-ins-${stamp}.csv`, weighInsCsv(await db.weighIns.toArray()), 'text/csv')}>Weigh-ins CSV</Button>
            <Button variant="secondary" onClick={async () => download(`lifts-${stamp}.csv`, liftsCsv(await db.workouts.toArray()), 'text/csv')}>Lifts CSV</Button>
          </div>
        </div>
      </Card>

      <Card title="Reset">
        <p className="mb-3 text-sm">Deletes everything and reloads the plan’s seed data. Export a backup first.</p>
        <Button
          variant="danger"
          className="w-full"
          onClick={async () => {
            if (prompt('Type RESET to delete all data') !== 'RESET') return
            await db.transaction('rw', db.tables, async () => {
              for (const t of db.tables) await t.clear()
            })
            await ensureSeeded()
            flash('All data reset to the plan’s seed data')
          }}
        >
          Reset all data
        </Button>
      </Card>
      <p className="pb-4 text-center text-xs text-slate-500">All data stays on this device. No accounts, no tracking.</p>
    </div>
  )
}
