import { useState } from 'react'
import { Card } from '@/components/Card'
import { ArabicText } from '@/components/ArabicText'
import { ConfidenceButtons } from '@/components/ConfidenceButtons'
import type { RunnerCard } from '@/lib/reviewRunner'
import type { ConfidenceRating } from '@/types'

/** Card-by-card "front, reveal, rate" runner shared by Today's Review and
 * the guided Daily Study Session. */
export function ReviewRunner({
  cards,
  onRate,
  onComplete,
  emptyMessage = 'Nothing to review here right now.',
}: {
  cards: RunnerCard[]
  onRate: (card: RunnerCard, confidence: ConfidenceRating) => void
  onComplete: () => void
  emptyMessage?: string
}) {
  const [index, setIndex] = useState(0)
  const [revealed, setRevealed] = useState(false)

  if (cards.length === 0) {
    return <p className="text-sm text-[var(--color-ink-soft)]">{emptyMessage}</p>
  }

  const card = cards[index]

  function handleRate(confidence: ConfidenceRating) {
    onRate(card, confidence)
    setRevealed(false)
    if (index + 1 >= cards.length) {
      onComplete()
    } else {
      setIndex((i) => i + 1)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <span className="text-xs text-[var(--color-ink-soft)]">
        {index + 1} / {cards.length}
      </span>
      <Card className="flex flex-col gap-4">
        {card.frontArabic && <ArabicText size="lg">{card.frontArabic}</ArabicText>}
        <p className="font-medium text-[var(--color-ink)]">{card.frontText}</p>

        {!revealed ? (
          <button
            type="button"
            onClick={() => setRevealed(true)}
            className="self-start rounded-lg bg-[var(--color-accent)] px-4 py-2 text-sm font-medium text-white hover:opacity-90"
          >
            Reveal answer
          </button>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-accent-soft)]/40 p-3">
              {card.revealArabic && (
                <ArabicText size="lg" matn>
                  {card.revealArabic}
                </ArabicText>
              )}
              <p className="whitespace-pre-line text-sm text-[var(--color-ink)]">{card.revealText}</p>
            </div>
            <div className="flex flex-col gap-2">
              <span className="text-xs font-medium uppercase tracking-wide text-[var(--color-ink-soft)]">
                How well did you know this?
              </span>
              <ConfidenceButtons onRate={handleRate} />
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}
