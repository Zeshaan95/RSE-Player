/** Strips Arabic diacritics (tashkīl) so recall comparison isn't sunk by
 * whether the student typed vowel marks. */
export function stripDiacritics(text: string): string {
  return text.replace(/[ؐ-ًؚ-ٟۖ-ۭ]/g, '')
}

/** Arabic and Latin punctuation that shouldn't affect whether two words "match". */
const PUNCTUATION = /[.,،؛:؟!"'()«»]/g

function normalise(word: string): string {
  return stripDiacritics(word).replace(PUNCTUATION, '').trim()
}

export interface WordComparison {
  word: string
  matched: boolean
}

/** Word-by-word comparison of the student's typed recall against the
 * reference matn text. Used to highlight what was remembered correctly
 * without requiring an exact character-perfect match. */
export function compareRecall(userText: string, referenceText: string): WordComparison[] {
  const refWords = referenceText.split(/\s+/).filter(Boolean)
  const userWords = new Set(userText.split(/\s+/).filter(Boolean).map(normalise))

  return refWords.map((word) => ({
    word,
    matched: userWords.has(normalise(word)),
  }))
}

export function recallAccuracy(userText: string, referenceText: string): number {
  const comparison = compareRecall(userText, referenceText)
  if (comparison.length === 0) return 0
  const matched = comparison.filter((c) => c.matched).length
  return matched / comparison.length
}
