import type { Chapter, Example, IrabExercise, Lesson, MemorisationSection, RecallQuestion } from '@/types'

// Vite statically discovers every chapter JSON file at build time. Adding a
// new chapter-NN.json file under /content/chapters is enough to make it
// appear in the app - nothing else needs to change.
const modules = import.meta.glob('../../content/chapters/*.json', { eager: true }) as Record<
  string,
  { default: Chapter }
>

export const chapters: Chapter[] = Object.values(modules)
  .map((m) => m.default)
  .sort((a, b) => a.number - b.number)

export const lessons: Lesson[] = chapters.flatMap((c) => c.lessons)

export function getChapter(chapterId: string): Chapter | undefined {
  return chapters.find((c) => c.id === chapterId)
}

export function getLesson(lessonId: string): Lesson | undefined {
  return lessons.find((l) => l.id === lessonId)
}

export function getChapterForLesson(lessonId: string): Chapter | undefined {
  return chapters.find((c) => c.lessons.some((l) => l.id === lessonId))
}

export function getAllExamples(): Example[] {
  return lessons.flatMap((l) => l.examples)
}

export function getAllRecallQuestions(): RecallQuestion[] {
  return lessons.flatMap((l) => l.recallQuestions)
}

export function getAllMemorisationSections(): MemorisationSection[] {
  return lessons.flatMap((l) => l.memorisationSections)
}

export function getAllIrabExercises(): IrabExercise[] {
  return lessons.flatMap((l) => l.irabExercises)
}

export function getNextLesson(currentLessonId: string | null): Lesson | undefined {
  if (!currentLessonId) return lessons.filter((l) => !l.isPlaceholder)[0]
  const idx = lessons.findIndex((l) => l.id === currentLessonId)
  if (idx === -1) return lessons.filter((l) => !l.isPlaceholder)[0]
  return lessons.slice(idx + 1).find((l) => !l.isPlaceholder)
}

/** Best-effort human-readable label for any refId used in bookmarks/SRS,
 * regardless of which kind of content item it points to. */
export function resolveRefLabel(refId: string): { label: string; lessonId?: string } {
  const lesson = getLesson(refId)
  if (lesson) return { label: lesson.titleArabic, lessonId: lesson.id }

  const recall = getAllRecallQuestions().find((q) => q.id === refId)
  if (recall) return { label: recall.questionEnglish, lessonId: recall.lessonId }

  const mem = getAllMemorisationSections().find((m) => m.id === refId)
  if (mem) return { label: mem.arabicText.slice(0, 40) + (mem.arabicText.length > 40 ? '…' : ''), lessonId: mem.lessonId }

  const irab = getAllIrabExercises().find((e) => e.id === refId)
  if (irab) return { label: irab.sentenceArabic, lessonId: irab.lessonId }

  const example = getAllExamples().find((e) => e.id === refId)
  if (example) return { label: example.arabicSentence, lessonId: example.lessonId }

  return { label: refId }
}

export function searchContent(query: string) {
  const q = query.trim().toLowerCase()
  if (!q) return { lessons: [], examples: [], keyTerms: [] as { term: (typeof lessons)[number]['keyTerms'][number]; lesson: Lesson }[] }

  const matchedLessons = lessons.filter(
    (l) =>
      l.titleArabic.includes(query) ||
      l.titleEnglish.toLowerCase().includes(q) ||
      l.matnArabic.includes(query) ||
      l.translation.toLowerCase().includes(q) ||
      l.explanation.toLowerCase().includes(q),
  )

  const matchedExamples = getAllExamples().filter(
    (e) => e.arabicSentence.includes(query) || e.translation.toLowerCase().includes(q),
  )

  const matchedKeyTerms = lessons.flatMap((l) =>
    l.keyTerms
      .filter(
        (t) =>
          t.arabic.includes(query) ||
          t.english.toLowerCase().includes(q) ||
          t.definition.toLowerCase().includes(q),
      )
      .map((term) => ({ term, lesson: l })),
  )

  return { lessons: matchedLessons, examples: matchedExamples, keyTerms: matchedKeyTerms }
}
