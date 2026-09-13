import { useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Card, PlaceholderNotice } from '@/components/Card'
import { ArabicText } from '@/components/ArabicText'
import { BookmarkButton } from '@/components/BookmarkButton'
import { getChapterForLesson, getLesson } from '@/lib/content'
import { useProgressStore } from '@/store/progressStore'

export function LessonPage() {
  const { lessonId } = useParams<{ lessonId: string }>()
  const lesson = lessonId ? getLesson(lessonId) : undefined
  const chapter = lessonId ? getChapterForLesson(lessonId) : undefined
  const setCurrentLesson = useProgressStore((s) => s.setCurrentLesson)
  const markLessonCompleted = useProgressStore((s) => s.markLessonCompleted)
  const lessonsCompleted = useProgressStore((s) => s.lessonsCompleted)

  useEffect(() => {
    if (lesson && chapter) setCurrentLesson(chapter.id, lesson.id)
  }, [lesson, chapter, setCurrentLesson])

  if (!lesson || !chapter) {
    return <p className="text-sm text-[var(--color-ink-soft)]">Lesson not found.</p>
  }

  const isCompleted = lessonsCompleted.includes(lesson.id)

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <Link to="/curriculum" className="text-xs text-[var(--color-ink-soft)] hover:underline">
          ← {chapter.titleEnglish}
        </Link>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h1 className="font-arabic text-2xl">{lesson.titleArabic}</h1>
          <BookmarkButton itemType="recall" refId={lesson.id} lessonId={lesson.id} />
        </div>
        <p className="text-sm text-[var(--color-ink-soft)]">{lesson.titleEnglish}</p>
      </div>

      {lesson.isPlaceholder && <PlaceholderNotice />}

      <Card className="flex flex-col gap-4">
        <div>
          <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-[var(--color-ink-soft)]">
            Matn (original text)
          </span>
          <ArabicText size="xl" matn>
            {lesson.matnArabic}
          </ArabicText>
        </div>
        <div>
          <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-[var(--color-ink-soft)]">
            Translation
          </span>
          <p className="text-[var(--color-ink)]">{lesson.translation}</p>
        </div>
      </Card>

      <Card className="flex flex-col gap-2">
        <h2 className="font-medium">Explanation</h2>
        <p className="text-sm leading-relaxed text-[var(--color-ink)]">{lesson.explanation}</p>
      </Card>

      {lesson.keyTerms.length > 0 && (
        <Card className="flex flex-col gap-3">
          <h2 className="font-medium">Key terminology</h2>
          <dl className="flex flex-col divide-y divide-[var(--color-border)]">
            {lesson.keyTerms.map((term) => (
              <div key={term.id} className="flex flex-col gap-1 py-2 sm:flex-row sm:items-baseline sm:gap-3">
                <dt className="flex shrink-0 items-baseline gap-2 sm:w-40">
                  <span className="font-arabic text-lg">{term.arabic}</span>
                </dt>
                <dd className="text-sm text-[var(--color-ink-soft)]">
                  <span className="font-medium text-[var(--color-ink)]">{term.english}</span> — {term.definition}
                </dd>
              </div>
            ))}
          </dl>
        </Card>
      )}

      {lesson.examples.length > 0 && (
        <Card className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="font-medium">Examples</h2>
            <Link to={`/examples?lesson=${lesson.id}`} className="text-xs text-[var(--color-accent)] hover:underline">
              Open in Example Bank →
            </Link>
          </div>
          <ul className="flex flex-col gap-2">
            {lesson.examples.slice(0, 3).map((ex) => (
              <li key={ex.id} className="rounded-lg border border-[var(--color-border)] px-3 py-2">
                <ArabicText size="lg">{ex.arabicSentence}</ArabicText>
                <p className="text-sm text-[var(--color-ink-soft)]">{ex.translation}</p>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <div className="flex flex-wrap gap-3">
        <Link
          to={`/lesson/${lesson.id}/memorise`}
          className="rounded-lg bg-[var(--color-accent)] px-4 py-2 text-sm font-medium text-white hover:opacity-90"
        >
          Memorise this passage
        </Link>
        <Link
          to={`/lesson/${lesson.id}/recall`}
          className="rounded-lg border border-[var(--color-border)] px-4 py-2 text-sm font-medium hover:border-[var(--color-accent)]"
        >
          Practice recall
        </Link>
        <Link
          to={`/explain/${lesson.id}`}
          className="rounded-lg border border-[var(--color-border)] px-4 py-2 text-sm font-medium hover:border-[var(--color-accent)]"
        >
          Explain it yourself
        </Link>
        {!isCompleted && (
          <button
            type="button"
            onClick={() => markLessonCompleted(lesson.id)}
            className="rounded-lg border border-emerald-500 px-4 py-2 text-sm font-medium text-emerald-700 hover:bg-emerald-50"
          >
            Mark lesson as studied
          </button>
        )}
      </div>
    </div>
  )
}
