import type {
  ConfidenceRating,
  MasteryStatus,
  MemorisationConfidence,
  ReviewItem,
  ReviewItemType,
} from '@/types'

/**
 * Spaced-repetition scheduling for al-Ājurrūmiyyah study items.
 *
 * The ladder below is the progression named in the product spec:
 * 1 day → 3 days → 7 days → 14 days → 30 days → 60 days → 90 days.
 *
 * A brand-new item is not yet "on" the ladder. Its very first rating maps
 * directly onto the requested initial mapping (again → later today,
 * difficult → 1 day, good → 3 days, easy → 7 days), which happens to land
 * exactly on rungs 0, 1 and 2 of the ladder for difficult/good/easy. Every
 * later rating moves the item up or down the same ladder rather than
 * resetting from a fixed table, so performance - not the calendar - drives
 * the schedule.
 */
export const LADDER_DAYS = [1, 3, 7, 14, 30, 60, 90] as const

const MIN_EASE = 1.3
const MAX_EASE = 3.0
const DEFAULT_EASE = 2.5
/** How soon an "again" item resurfaces within the same study session. */
const AGAIN_MINUTES = 10

function clampEase(value: number): number {
  return Math.min(MAX_EASE, Math.max(MIN_EASE, value))
}

/** Index of the ladder rung at or below the given interval. */
function rungIndexFor(intervalDays: number): number {
  let idx = 0
  for (let i = 0; i < LADDER_DAYS.length; i++) {
    if (LADDER_DAYS[i] <= intervalDays) idx = i
  }
  return idx
}

export function createReviewItem(
  itemType: ReviewItemType,
  refId: string,
  lessonId: string,
  chapterId: string,
  now: Date = new Date(),
): ReviewItem {
  return {
    id: `${itemType}:${refId}`,
    itemType,
    refId,
    lessonId,
    chapterId,
    status: 'new',
    repetitions: 0,
    lapses: 0,
    easeFactor: DEFAULT_EASE,
    intervalDays: 0,
    dueAt: now.toISOString(),
    longestIntervalDays: 0,
    createdAt: now.toISOString(),
  }
}

/** Map the four-option memorisation confidence scale onto the shared rating scale. */
export function memorisationConfidenceToRating(
  c: MemorisationConfidence,
): ConfidenceRating {
  switch (c) {
    case 'forgot':
      return 'again'
    case 'almost':
      return 'difficult'
    case 'difficult':
      return 'difficult'
    case 'easy':
      return 'easy'
  }
}

export function scheduleReview(
  item: ReviewItem,
  confidence: ConfidenceRating,
  now: Date = new Date(),
): ReviewItem {
  const isNew = !item.lastReviewedAt
  let repetitions = item.repetitions
  let lapses = item.lapses
  let easeFactor = item.easeFactor
  let intervalDays = item.intervalDays
  let status: MasteryStatus
  let dueAt: string

  if (confidence === 'again') {
    lapses += 1
    easeFactor = clampEase(easeFactor - 0.2)
    repetitions = 0
    intervalDays = 0
    status = item.status === 'mastered' || item.status === 'review' ? 'needs_review' : 'learning'
    dueAt = new Date(now.getTime() + AGAIN_MINUTES * 60 * 1000).toISOString()
  } else if (confidence === 'difficult') {
    easeFactor = clampEase(easeFactor - 0.15)
    if (isNew) {
      repetitions = 1
      intervalDays = LADDER_DAYS[0]
    } else {
      const currentRung = rungIndexFor(intervalDays)
      const newRung = Math.max(0, currentRung - 1)
      repetitions = newRung + 1
      intervalDays = LADDER_DAYS[newRung]
    }
    status = 'review'
    dueAt = addDays(now, intervalDays).toISOString()
  } else if (confidence === 'good') {
    easeFactor = clampEase(easeFactor + 0.02)
    if (isNew) {
      repetitions = 2
      intervalDays = LADDER_DAYS[1]
    } else {
      const currentRung = rungIndexFor(intervalDays)
      const newRung = Math.min(LADDER_DAYS.length - 1, currentRung + 1)
      repetitions = newRung + 1
      intervalDays =
        newRung === currentRung
          ? Math.round(intervalDays * easeFactor)
          : LADDER_DAYS[newRung]
    }
    status = repetitions >= LADDER_DAYS.length ? 'mastered' : 'review'
    dueAt = addDays(now, intervalDays).toISOString()
  } else {
    // easy
    easeFactor = clampEase(easeFactor + 0.1)
    if (isNew) {
      repetitions = 3
      intervalDays = LADDER_DAYS[2]
    } else {
      const currentRung = rungIndexFor(intervalDays)
      const newRung = Math.min(LADDER_DAYS.length - 1, currentRung + 2)
      repetitions = newRung + 1
      intervalDays =
        newRung === currentRung
          ? Math.round(intervalDays * easeFactor * 1.3)
          : LADDER_DAYS[newRung]
    }
    status = 'mastered'
    dueAt = addDays(now, intervalDays).toISOString()
  }

  return {
    ...item,
    repetitions,
    lapses,
    easeFactor,
    intervalDays,
    dueAt,
    status,
    lastReviewedAt: now.toISOString(),
    lastConfidence: confidence,
    longestIntervalDays: Math.max(item.longestIntervalDays, intervalDays),
  }
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d
}

export function isDue(item: ReviewItem, now: Date = new Date()): boolean {
  return new Date(item.dueAt).getTime() <= now.getTime()
}

export function getDueItems(items: ReviewItem[], now: Date = new Date()): ReviewItem[] {
  return items
    .filter((i) => isDue(i, now))
    .sort((a, b) => new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime())
}

export function getNewItems(items: ReviewItem[]): ReviewItem[] {
  return items.filter((i) => i.status === 'new')
}
