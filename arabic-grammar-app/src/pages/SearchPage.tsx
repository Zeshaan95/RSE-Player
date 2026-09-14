import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Card } from '@/components/Card'
import { ArabicText, ArabicInline } from '@/components/ArabicText'
import { searchContent } from '@/lib/content'

export function SearchPage() {
  const [query, setQuery] = useState('')
  const results = searchContent(query)
  const hasResults = results.lessons.length + results.examples.length + results.keyTerms.length > 0

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Search</h1>
        <p className="text-sm text-[var(--color-ink-soft)]">
          Search Arabic or English terms, grammar concepts, matn passages, and examples across the whole
          curriculum.
        </p>
      </div>

      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="e.g. فاعل, or 'nominative'..."
        dir="auto"
        className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-lg focus:border-[var(--color-accent)] focus:outline-none"
        autoFocus
      />

      {query.trim() && !hasResults && (
        <p className="text-sm text-[var(--color-ink-soft)]">No results for "{query}".</p>
      )}

      {results.keyTerms.length > 0 && (
        <Card className="flex flex-col gap-3">
          <h2 className="font-medium">Key terms</h2>
          <ul className="flex flex-col divide-y divide-[var(--color-border)]">
            {results.keyTerms.map(({ term, lesson }) => (
              <li key={term.id} className="py-2">
                <Link to={`/lesson/${lesson.id}`} className="flex flex-col gap-0.5 hover:underline">
                  <span className="font-arabic text-lg">{term.arabic}</span>
                  <span className="text-sm text-[var(--color-ink-soft)]">
                    {term.english} — {term.definition}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {results.lessons.length > 0 && (
        <Card className="flex flex-col gap-3">
          <h2 className="font-medium">Lessons</h2>
          <ul className="flex flex-col divide-y divide-[var(--color-border)]">
            {results.lessons.map((lesson) => (
              <li key={lesson.id} className="py-2">
                <Link to={`/lesson/${lesson.id}`} className="flex flex-col gap-0.5 hover:underline">
                  <span className="font-arabic text-lg">{lesson.titleArabic}</span>
                  <span className="text-sm text-[var(--color-ink-soft)]">{lesson.titleEnglish}</span>
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {results.examples.length > 0 && (
        <Card className="flex flex-col gap-3">
          <h2 className="font-medium">Examples</h2>
          <ul className="flex flex-col divide-y divide-[var(--color-border)]">
            {results.examples.map((ex) => (
              <li key={ex.id} className="py-2">
                <Link to={`/examples?lesson=${ex.lessonId}`} className="flex flex-col gap-0.5 hover:underline">
                  <ArabicText size="base">{ex.arabicSentence}</ArabicText>
                  <span className="text-sm text-[var(--color-ink-soft)]">{ex.translation}</span>
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {!query.trim() && (
        <p className="text-sm text-[var(--color-ink-soft)]">
          Try searching for a term like <ArabicInline>فاعل</ArabicInline> or "nominative".
        </p>
      )}
    </div>
  )
}
