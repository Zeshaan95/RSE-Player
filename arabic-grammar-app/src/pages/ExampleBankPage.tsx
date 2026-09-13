import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Card } from '@/components/Card'
import { ArabicText } from '@/components/ArabicText'
import { BookmarkButton } from '@/components/BookmarkButton'
import { getAllExamples, getLesson, lessons } from '@/lib/content'
import { useUserContentStore } from '@/store/userContentStore'

function ExampleCard({
  example,
}: {
  example: ReturnType<typeof getAllExamples>[number]
}) {
  const [showAnswer, setShowAnswer] = useState(false)
  const lesson = getLesson(example.lessonId)

  return (
    <Card className="flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <ArabicText size="lg">{example.arabicSentence}</ArabicText>
        <BookmarkButton itemType="example" refId={example.id} lessonId={example.lessonId} />
      </div>
      <p className="text-sm text-[var(--color-ink-soft)]">{example.translation}</p>
      <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--color-ink-soft)]">
        {lesson && <span>From: {lesson.titleEnglish}</span>}
        {example.isUserAdded && (
          <span className="rounded-full bg-[var(--color-accent-soft)] px-2 py-0.5 text-[var(--color-accent)]">
            Your example
          </span>
        )}
      </div>

      {(example.irabAnswer || example.componentBreakdown) && (
        <div>
          {!showAnswer ? (
            <button
              type="button"
              onClick={() => setShowAnswer(true)}
              className="rounded-lg border border-[var(--color-border)] px-3 py-1.5 text-xs hover:border-[var(--color-accent)]"
            >
              Try to identify the components, then show iʿrāb
            </button>
          ) : (
            <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-accent-soft)]/40 p-3">
              {example.componentBreakdown && (
                <ul className="mb-2 flex flex-col gap-1 text-sm">
                  {example.componentBreakdown.map((c, idx) => (
                    <li key={idx} className="flex items-center gap-2">
                      <ArabicText size="sm" className="inline">
                        {c.word}
                      </ArabicText>
                      <span className="text-[var(--color-ink-soft)]">— {c.role}</span>
                    </li>
                  ))}
                </ul>
              )}
              {example.irabAnswer && <ArabicText size="sm">{example.irabAnswer}</ArabicText>}
            </div>
          )}
        </div>
      )}
    </Card>
  )
}

export function ExampleBankPage() {
  const [params, setParams] = useSearchParams()
  const lessonFilter = params.get('lesson') ?? ''
  const userExamples = useUserContentStore((s) => s.userExamples)
  const addExample = useUserContentStore((s) => s.addExample)

  const [newArabic, setNewArabic] = useState('')
  const [newTranslation, setNewTranslation] = useState('')
  const [newLessonId, setNewLessonId] = useState(lessons[0]?.id ?? '')

  const allExamples = [...getAllExamples(), ...userExamples]
  const filtered = lessonFilter ? allExamples.filter((e) => e.lessonId === lessonFilter) : allExamples

  function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!newArabic.trim() || !newTranslation.trim() || !newLessonId) return
    addExample(newLessonId, newArabic.trim(), newTranslation.trim())
    setNewArabic('')
    setNewTranslation('')
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Example Bank</h1>
        <p className="text-sm text-[var(--color-ink-soft)]">
          Worked examples for every grammar rule. Try to identify the components yourself before revealing the
          iʿrāb.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <label className="text-sm text-[var(--color-ink-soft)]" htmlFor="lesson-filter">
          Filter by lesson:
        </label>
        <select
          id="lesson-filter"
          value={lessonFilter}
          onChange={(e) => setParams(e.target.value ? { lesson: e.target.value } : {})}
          className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1.5 text-sm"
        >
          <option value="">All lessons</option>
          {lessons
            .filter((l) => !l.isPlaceholder)
            .map((l) => (
              <option key={l.id} value={l.id}>
                {l.titleEnglish}
              </option>
            ))}
        </select>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {filtered.map((ex) => (
          <ExampleCard key={ex.id} example={ex} />
        ))}
        {filtered.length === 0 && (
          <p className="text-sm text-[var(--color-ink-soft)]">No examples for this lesson yet.</p>
        )}
      </div>

      <Card className="flex flex-col gap-3">
        <h2 className="font-medium">Add your own example</h2>
        <form onSubmit={handleAdd} className="flex flex-col gap-3">
          <select
            value={newLessonId}
            onChange={(e) => setNewLessonId(e.target.value)}
            className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm"
          >
            {lessons
              .filter((l) => !l.isPlaceholder)
              .map((l) => (
                <option key={l.id} value={l.id}>
                  {l.titleEnglish}
                </option>
              ))}
          </select>
          <input
            dir="rtl"
            lang="ar"
            value={newArabic}
            onChange={(e) => setNewArabic(e.target.value)}
            placeholder="اكتب جملتك هنا"
            className="font-arabic rounded-lg border border-[var(--color-border)] bg-[var(--color-paper)] p-3 text-lg focus:border-[var(--color-accent)] focus:outline-none"
          />
          <input
            value={newTranslation}
            onChange={(e) => setNewTranslation(e.target.value)}
            placeholder="Translation"
            className="rounded-lg border border-[var(--color-border)] bg-[var(--color-paper)] p-3 text-sm focus:border-[var(--color-accent)] focus:outline-none"
          />
          <button
            type="submit"
            className="self-start rounded-lg bg-[var(--color-accent)] px-4 py-2 text-sm font-medium text-white hover:opacity-90"
          >
            Add example
          </button>
        </form>
      </Card>
    </div>
  )
}
