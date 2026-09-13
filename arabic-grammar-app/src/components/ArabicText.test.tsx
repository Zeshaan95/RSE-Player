import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ArabicText, ArabicInline } from './ArabicText'

describe('ArabicText RTL rendering', () => {
  it('renders with dir="rtl" and lang="ar" so Arabic text flows correctly', () => {
    render(<ArabicText>الكلام</ArabicText>)
    const el = screen.getByText('الكلام')
    expect(el).toHaveAttribute('dir', 'rtl')
    expect(el).toHaveAttribute('lang', 'ar')
    expect(el.className).toMatch(/font-arabic/)
  })

  it('applies the wider matn line-height class when matn is set', () => {
    render(<ArabicText matn>الكلام هو اللفظ</ArabicText>)
    const el = screen.getByText('الكلام هو اللفظ')
    expect(el.className).toMatch(/matn-text/)
  })

  it('ArabicInline also marks direction and language for embedded Arabic terms', () => {
    render(
      <p>
        The word <ArabicInline>فاعل</ArabicInline> means subject.
      </p>,
    )
    const el = screen.getByText('فاعل')
    expect(el).toHaveAttribute('dir', 'rtl')
    expect(el).toHaveAttribute('lang', 'ar')
    expect(el.tagName).toBe('SPAN')
  })
})
