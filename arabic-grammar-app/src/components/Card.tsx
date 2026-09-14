import type { ReactNode } from 'react'

export function Card({
  children,
  className = '',
  as: As = 'div',
}: {
  children: ReactNode
  className?: string
  as?: 'div' | 'section' | 'article'
}) {
  return (
    <As
      className={`rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm ${className}`}
    >
      {children}
    </As>
  )
}

export function PlaceholderNotice({ children }: { children?: ReactNode }) {
  return (
    <div className="rounded-lg border border-dashed border-amber-400/60 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
      <strong className="font-semibold">Placeholder content.</strong>{' '}
      {children ?? 'The authentic matn text has not yet been inserted here. Do not memorise this passage as the original text.'}
    </div>
  )
}
