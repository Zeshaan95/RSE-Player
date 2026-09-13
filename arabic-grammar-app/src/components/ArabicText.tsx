import type { ReactNode } from 'react'

interface ArabicTextProps {
  children: ReactNode
  size?: 'sm' | 'base' | 'lg' | 'xl' | '2xl'
  className?: string
  /** Use the wider line-height suited to multi-line matn passages. */
  matn?: boolean
}

const sizeClasses: Record<NonNullable<ArabicTextProps['size']>, string> = {
  sm: 'text-base',
  base: 'text-xl',
  lg: 'text-2xl',
  xl: 'text-3xl',
  '2xl': 'text-4xl',
}

export function ArabicText({ children, size = 'base', className = '', matn = false }: ArabicTextProps) {
  return (
    <p
      dir="rtl"
      lang="ar"
      className={`${matn ? 'matn-text' : 'font-arabic'} ${sizeClasses[size]} text-[var(--color-ink)] ${className}`}
    >
      {children}
    </p>
  )
}

export function ArabicInline({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <span dir="rtl" lang="ar" className={`font-arabic ${className}`}>
      {children}
    </span>
  )
}
