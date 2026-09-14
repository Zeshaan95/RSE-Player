import { describe, expect, it } from 'vitest'
import { compareRecall, recallAccuracy, stripDiacritics } from './textCompare'

describe('stripDiacritics', () => {
  it('removes tashkīl but keeps the consonant skeleton', () => {
    expect(stripDiacritics('الْكَلاَمُ')).toBe('الكلام')
  })
})

describe('compareRecall', () => {
  it('matches words regardless of diacritics and punctuation', () => {
    const result = compareRecall('الكلام هو اللفظ', 'الْكَلاَمُ: هُوَ اللَّفْظُ الْمُرَكَّبُ')
    expect(result[0]).toEqual({ word: 'الْكَلاَمُ:', matched: true })
    expect(result[1]).toEqual({ word: 'هُوَ', matched: true })
    expect(result[2]).toEqual({ word: 'اللَّفْظُ', matched: true })
    expect(result[3].matched).toBe(false)
  })

  it('marks every reference word unmatched when nothing was typed', () => {
    const result = compareRecall('', 'الكلام هو اللفظ')
    expect(result.every((w) => !w.matched)).toBe(true)
  })
})

describe('recallAccuracy', () => {
  it('is 1 for a perfect recall', () => {
    expect(recallAccuracy('الكلام هو اللفظ', 'الكلام هو اللفظ')).toBe(1)
  })

  it('is a fraction for a partial recall', () => {
    expect(recallAccuracy('الكلام هو', 'الكلام هو اللفظ المركب')).toBe(0.5)
  })

  it('is 0 for an empty reference', () => {
    expect(recallAccuracy('anything', '')).toBe(0)
  })
})
