/** Types describing the spaced-repetition review system. */

export type ReviewItemType = 'memorisation' | 'recall' | 'irab' | 'explain'

/** The student's self-rated confidence, used to schedule the next review. */
export type ConfidenceRating = 'again' | 'difficult' | 'good' | 'easy'

/** Matches the four-way rating requested for memorisation checks specifically. */
export type MemorisationConfidence =
  | 'easy'
  | 'difficult'
  | 'almost'
  | 'forgot'

export type MasteryStatus = 'new' | 'learning' | 'review' | 'mastered' | 'needs_review'

/** One trackable, schedulable unit of study (a matn passage, a recall
 * question, an iʿrāb exercise, or a concept explained in one's own words). */
export interface ReviewItem {
  id: string
  itemType: ReviewItemType
  /** id of the MemorisationSection / RecallQuestion / IrabExercise / Lesson (for explain). */
  refId: string
  lessonId: string
  chapterId: string

  status: MasteryStatus
  /** Number of successful reviews in a row. */
  repetitions: number
  /** Number of times this item has been rated "again"/"forgot" ever. */
  lapses: number
  /** SM-2 style ease factor, bounded to a sane minimum. */
  easeFactor: number
  /** Current interval in days between reviews. */
  intervalDays: number
  /** ISO datetime this item is next due. */
  dueAt: string
  /** ISO datetime of the last review, if any. */
  lastReviewedAt?: string
  lastConfidence?: ConfidenceRating
  /** Longest interval (days) this item has ever reached, for retention stats. */
  longestIntervalDays: number
  createdAt: string
}

export interface AnswerLogEntry {
  id: string
  reviewItemId: string
  itemType: ReviewItemType
  refId: string
  answeredAt: string
  confidence?: ConfidenceRating
  correct?: boolean
  userAnswer?: string
}
