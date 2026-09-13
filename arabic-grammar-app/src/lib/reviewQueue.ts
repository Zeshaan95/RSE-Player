import type { ReviewItem } from '@/types'
import { getDueItems } from '@/lib/srs'
import type { ReviewSessionSizes } from '@/store/settingsStore'

/**
 * Builds a manageable "Today's Review" session out of everything that is
 * currently due, instead of dumping the whole backlog on the student.
 * Bookmarked/difficult items are surfaced first within each bucket, then
 * whatever has been waiting longest (oldest dueAt).
 */
export function buildReviewQueue(
  items: ReviewItem[],
  difficultRefIds: Set<string>,
  sizes: ReviewSessionSizes,
  now: Date = new Date(),
) {
  const due = getDueItems(items, now)

  const rank = (item: ReviewItem) => (difficultRefIds.has(item.refId) ? 0 : 1)
  const sortBucket = (bucket: ReviewItem[]) =>
    [...bucket].sort((a, b) => rank(a) - rank(b) || new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime())

  const memorisation = sortBucket(due.filter((i) => i.itemType === 'memorisation')).slice(0, sizes.memorisation)
  const grammar = sortBucket(due.filter((i) => i.itemType === 'recall' || i.itemType === 'explain')).slice(
    0,
    sizes.grammar,
  )
  const irab = sortBucket(due.filter((i) => i.itemType === 'irab')).slice(0, sizes.irab)

  return { memorisation, grammar, irab }
}

export function dueCounts(items: ReviewItem[], now: Date = new Date()) {
  const due = getDueItems(items, now)
  return {
    total: due.length,
    memorisation: due.filter((i) => i.itemType === 'memorisation').length,
    recall: due.filter((i) => i.itemType === 'recall').length,
    irab: due.filter((i) => i.itemType === 'irab').length,
    explain: due.filter((i) => i.itemType === 'explain').length,
  }
}

export function newCount(items: ReviewItem[]) {
  return items.filter((i) => i.status === 'new').length
}

export function nextDue(items: ReviewItem[], now: Date = new Date()): ReviewItem | undefined {
  const upcoming = items
    .filter((i) => new Date(i.dueAt).getTime() > now.getTime())
    .sort((a, b) => new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime())
  return upcoming[0]
}
