import type { ReviewItemType } from './srs'

export interface IrabSkillProgress {
  level: 1 | 2 | 3 | 4 | 5
  attempts: number
  correct: number
}

export interface UserProgress {
  streakDays: number
  /** ISO date (yyyy-mm-dd) of the last day the student studied. */
  lastStudyDate: string | null
  totalStudyMinutes: number
  /** ISO date -> minutes studied that day. */
  studyMinutesByDate: Record<string, number>

  chaptersCompleted: string[]
  lessonsCompleted: string[]
  conceptsMastered: string[]

  /** refIds of items the student has bookmarked as difficult. */
  difficultTopics: string[]
  /** refIds of items that lapsed back to 'needs_review' after being learned. */
  forgottenTopics: string[]

  longestRetentionDays: number

  irabSkillProgress: Record<1 | 2 | 3 | 4 | 5, IrabSkillProgress>
  irabAccuracyOverall: { attempts: number; correct: number }
  reviewAccuracy: { attempts: number; correct: number }

  dailyGoalMinutes: number

  currentChapterId: string | null
  currentLessonId: string | null
}

export interface Bookmark {
  id: string
  itemType: ReviewItemType | 'example'
  refId: string
  lessonId: string
  note?: string
  createdAt: string
}

export type StudySessionStep =
  | 'review'
  | 'new_lesson'
  | 'memorisation'
  | 'grammar_recall'
  | 'irab'
  | 'reflection'

export interface StudySessionRecord {
  id: string
  date: string
  startedAt: string
  completedAt?: string
  stepsCompleted: StudySessionStep[]
  durationMinutes: number
  reflectionNote?: string
  itemsReviewed: number
  itemsCorrect: number
}
