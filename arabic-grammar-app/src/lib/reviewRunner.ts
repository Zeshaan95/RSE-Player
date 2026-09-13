import type { ReviewItem, ReviewItemType } from '@/types'
import { getAllIrabExercises, getAllMemorisationSections, getAllRecallQuestions, getLesson } from '@/lib/content'

export interface RunnerCard {
  itemType: ReviewItemType
  refId: string
  lessonId: string
  chapterId: string
  frontArabic?: string
  frontText: string
  revealArabic?: string
  revealText: string
}

/** Turns an SRS ReviewItem into the front/back content needed to render a
 * review card, regardless of whether it's a memorisation passage, a recall
 * question, an explain-it-yourself concept, or an iʿrāb exercise. */
export function buildRunnerCard(item: ReviewItem): RunnerCard | null {
  if (item.itemType === 'memorisation') {
    const section = getAllMemorisationSections().find((s) => s.id === item.refId)
    if (!section) return null
    return {
      itemType: item.itemType,
      refId: item.refId,
      lessonId: item.lessonId,
      chapterId: item.chapterId,
      frontText: `Recall this passage from memory: ${section.translation}`,
      revealArabic: section.arabicText,
      revealText: section.translation,
    }
  }
  if (item.itemType === 'recall') {
    const q = getAllRecallQuestions().find((r) => r.id === item.refId)
    if (!q) return null
    return {
      itemType: item.itemType,
      refId: item.refId,
      lessonId: item.lessonId,
      chapterId: item.chapterId,
      frontArabic: q.questionArabic,
      frontText: q.questionEnglish,
      revealText: q.correctAnswer,
    }
  }
  if (item.itemType === 'explain') {
    const lesson = getLesson(item.refId)
    if (!lesson) return null
    return {
      itemType: item.itemType,
      refId: item.refId,
      lessonId: item.lessonId,
      chapterId: item.chapterId,
      frontText: `Explain in your own words: ${lesson.titleEnglish}`,
      frontArabic: lesson.titleArabic,
      revealText: lesson.explanation,
    }
  }
  const exercise = getAllIrabExercises().find((e) => e.id === item.refId)
  if (!exercise) return null
  const fullIrab = exercise.tokens.map((t) => t.fullIrab ?? `${t.word}: ${t.role ?? t.wordType}`).join('\n')
  return {
    itemType: item.itemType,
    refId: item.refId,
    lessonId: item.lessonId,
    chapterId: item.chapterId,
    frontArabic: exercise.sentenceArabic,
    frontText: `Give the iʿrāb of: ${exercise.translation}`,
    revealText: fullIrab,
  }
}
