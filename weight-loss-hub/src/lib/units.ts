import { UNITS } from '../plan'

export function kgToLb(kg: number): number {
  return kg * UNITS.lbPerKg
}

export function kgToStones(kg: number): number {
  return kg / UNITS.kgPerStone
}

export function stonesLbToKg(st: number, lb: number): number {
  return (st + lb / UNITS.lbPerStone) * UNITS.kgPerStone
}

/** Split kg into whole stones and pounds (rounded to `lbDp` decimals), carrying 14 lb into a stone. */
export function kgToStLb(kg: number, lbDp = 0): { st: number; lb: number; negative: boolean } {
  const negative = kg < 0
  const totalLb = Math.abs(kg) * UNITS.lbPerKg
  const f = 10 ** lbDp
  let st = Math.floor(totalLb / UNITS.lbPerStone)
  let lb = Math.round((totalLb - st * UNITS.lbPerStone) * f) / f
  if (lb >= UNITS.lbPerStone) {
    st += 1
    lb -= UNITS.lbPerStone
  }
  return { st, lb, negative }
}

/** "15 st 1 lb" */
export function fmtStLb(kg: number, lbDp = 0): string {
  const { st, lb, negative } = kgToStLb(kg, lbDp)
  const s = st > 0 ? `${st} st ${lb.toFixed(lbDp)} lb` : `${lb.toFixed(lbDp)} lb`
  return negative ? `−${s}` : s
}

export function fmtKg(kg: number, dp = 1): string {
  return `${kg.toFixed(dp)} kg`
}

/** Round to n decimal places (avoids float noise in displays/tests). */
export function round(n: number, dp = 2): number {
  const f = 10 ** dp
  return Math.round(n * f) / f
}
