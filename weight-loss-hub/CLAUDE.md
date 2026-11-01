# Weight-loss Hub: notes for future sessions

A personal, mobile-first, local-first PWA for Zeshaan's fat-loss plan: daily weigh-ins, workout logging, Sunday check-ins, habits, food audit and progress charts. There's no backend, no accounts and no analytics. All data lives in IndexedDB on the device.

## The plan (source of truth: `src/plan.ts`)

- Start 95.75 kg (15 st 1 lb) on 18 Oct 2026. The plan was reset on 31 Oct 2026, when the 7-day average was 96.7 kg.
- Milestones: 86.2 kg (1.5 st down) by Fri 1 Jan 2027, and 83.0 kg (2 st down) by Sun 31 Jan 2027. Hold or increase lifts throughout.
- Target path for the 7-day average: the `TARGET_PATH` points, interpolated linearly. There's no target outside 31 Oct to 31 Jan.
- Week:
  - Mon: jog (20–25 min, +5 min each fortnight from 31 Oct, cap 35–40)
  - Tue: Strength C
  - Wed: rest and cook-up
  - Thu: football
  - Fri: rest
  - Sat: Strength A, 08:00–10:00
  - Sun: Strength B, 08:00–10:00, then the weekly review
- Festive fortnight 19 Dec – 1 Jan: weekday sessions move to 10:00–11:30. A settings toggle swaps football for a 40-min jog or incline walk. Never more than 2 runs a week.
- Pull-up max test days: Sun 22 Nov and Sun 27 Dec, done first, strict reps. The previous best is 7.
- Daily targets:
  - 1,900 kcal, never below 1,750
  - Protein 160–180 g, fat ≈60 g, carbs ≈170 g, fibre 30 g+
  - Steps 10,000 up to and including 8 Nov, then 12,000
  - Water 2.5–3 L, sleep 7–8 h
  - Creatine daily
- Rules (each one is in `src/lib/`, with tests in `src/lib/calc.test.ts`):
  1. 7-day average: the mean of the earliest reading per day across the 7 days ending that day. Needs at least 3 readings. `weight.ts`
  2. Status: ±0.5 kg of target is On track, above that is Behind, below is Ahead. `weight.ts`
  3. Advice from 15 Nov, Sundays only. Rate = (avg 14 days ago − avg today) ÷ 2. `advice.ts`
     - 0.9–1.4 kg/week: change nothing.
     - 0.5 to under 0.9: +2,000 steps. If last Sunday was in the same band, cut 150 kcal (floor 1,750).
     - Under 0.5: 3-day food audit, then both changes.
     - Over 1.5 with lifts going down: +150 kcal carbs.
     - Never suggest a 6th session.
  4. 6 Dec: if more than 2 kg above target, push the 2-stone date back at the plan's 6 Dec→31 Jan pace. `weight.ts:dec6Check`
  5. Progression: every working set at the top of the range means +2.5 kg or the next dumbbell. Max-minus-one moves (pull-ups, dips) use the latest tested max − 1 and get no badge. `strength.ts`
  6. Compound top set drops two sessions in a row: "Check food and sleep". `strength.ts`
  7. Projection: least-squares line through the last 14 days of daily readings. `weight.ts:projection`
- Interpretation choices:
  - "Lifts going down" means a compound lift's latest top set in the last 14 days is below its first top set in that window.
  - "Apply" buttons on the advice card change `settings` (kcalTarget, stepsExtra, carbsG). They never change `plan.ts`.

## Code conventions

- Stack: React 19, TypeScript (strict), Vite, Tailwind v4, Recharts, Dexie (`dexie-react-hooks` `useLiveQuery`), vite-plugin-pwa (Workbox precache, `autoUpdate`).
- **Every plan number goes in `src/plan.ts`.** Don't hard-code targets in components.
- Dates are local `YYYY-MM-DD` strings (`ISODate`). Do date maths only through `src/lib/dates.ts` (UTC day numbers, so BST changes are safe). Display dates as "31 Oct 2026" using `fmtDate`/`fmtDateDay`. Use British English everywhere.
- Weight is in kg (2 dp stored), with st/lb shown alongside via `fmtStLb` (1 st = 6.35029 kg, 1 kg = 2.20462 lb).
- Calculations are pure functions in `src/lib/*` and take plain data. Components read Dexie through `src/hooks.ts`. Pure logic gets unit tests.
- DB schema is in `src/db/db.ts`. If you change a table, add a new `this.version(n)`, never edit v1. Keep `TABLES` in sync, because backup and export iterate it.
- Backup: `exportAll`/`importAll` in `src/db/backup.ts` do an exact restore, ids included. There's a round-trip test in `backup.test.ts`.
- UI: mobile-first at 390 × 844. Tap targets are ≥44 px (`min-h-11`/`h-12`). Number fields use `inputMode="decimal"` and a font size of 16 px or more, so iOS doesn't zoom. Support dark mode with `dark:` classes; the theme class goes on `<html>`.
- Chart colours come from `src/components/chartTheme.ts` (validated, colourblind-safe pairs for light and dark).

## Commands

```bash
npm install
npm run dev       # dev server
npm test          # vitest: all calculation + backup tests
npm run build     # typecheck + production build (+ service worker)
npm run preview   # serve dist/ (test offline / PWA here)
npm run icons     # regenerate PNG icons from public/favicon.svg (uses Playwright)
```
