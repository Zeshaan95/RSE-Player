import type { ReactNode } from 'react'
import { Card } from './Card'

export function StatTile({
  label,
  value,
  sub,
}: {
  label: string
  value: ReactNode
  sub?: ReactNode
}) {
  return (
    <Card className="flex flex-col gap-1">
      <span className="text-xs uppercase tracking-wide text-[var(--color-ink-soft)]">{label}</span>
      <span className="text-2xl font-semibold text-[var(--color-ink)]">{value}</span>
      {sub && <span className="text-xs text-[var(--color-ink-soft)]">{sub}</span>}
    </Card>
  )
}
