import type { ConfidenceRating, MemorisationConfidence } from '@/types'

const RATING_STYLES: Record<ConfidenceRating, string> = {
  again: 'bg-rose-600 hover:bg-rose-700 text-white',
  difficult: 'bg-amber-500 hover:bg-amber-600 text-white',
  good: 'bg-emerald-600 hover:bg-emerald-700 text-white',
  easy: 'bg-sky-600 hover:bg-sky-700 text-white',
}

const RATING_LABELS: Record<ConfidenceRating, string> = {
  again: 'Again',
  difficult: 'Difficult',
  good: 'Good',
  easy: 'Easy',
}

export function ConfidenceButtons({ onRate }: { onRate: (rating: ConfidenceRating) => void }) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {(Object.keys(RATING_LABELS) as ConfidenceRating[]).map((rating) => (
        <button
          key={rating}
          type="button"
          onClick={() => onRate(rating)}
          className={`rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${RATING_STYLES[rating]}`}
        >
          {RATING_LABELS[rating]}
        </button>
      ))}
    </div>
  )
}

const MEM_LABELS: Record<MemorisationConfidence, string> = {
  forgot: 'Completely forgot',
  almost: 'Almost knew it',
  difficult: 'Difficult',
  easy: 'Easy',
}

const MEM_STYLES: Record<MemorisationConfidence, string> = {
  forgot: 'bg-rose-600 hover:bg-rose-700 text-white',
  almost: 'bg-amber-500 hover:bg-amber-600 text-white',
  difficult: 'bg-orange-500 hover:bg-orange-600 text-white',
  easy: 'bg-emerald-600 hover:bg-emerald-700 text-white',
}

export function MemorisationConfidenceButtons({
  onRate,
}: {
  onRate: (rating: MemorisationConfidence) => void
}) {
  const order: MemorisationConfidence[] = ['forgot', 'almost', 'difficult', 'easy']
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {order.map((rating) => (
        <button
          key={rating}
          type="button"
          onClick={() => onRate(rating)}
          className={`rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${MEM_STYLES[rating]}`}
        >
          {MEM_LABELS[rating]}
        </button>
      ))}
    </div>
  )
}
