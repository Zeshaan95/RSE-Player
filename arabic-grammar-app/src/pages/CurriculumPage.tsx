import { Link } from 'react-router-dom'
import { Card } from '@/components/Card'
import { ArabicInline } from '@/components/ArabicText'
import { chapters } from '@/lib/content'
import { useProgressStore } from '@/store/progressStore'

export function CurriculumPage() {
  const lessonsCompleted = useProgressStore((s) => s.lessonsCompleted)

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Curriculum</h1>
        <p className="text-sm text-[var(--color-ink-soft)]">
          The traditional progression of <ArabicInline>متن الآجرومية</ArabicInline>: chapter, then lesson, then
          rule, examples, and practice.
        </p>
      </div>

      <div className="flex flex-col gap-5">
        {chapters.map((chapter) => {
          const doneCount = chapter.lessons.filter((l) => lessonsCompleted.includes(l.id)).length
          return (
            <Card key={chapter.id} className="flex flex-col gap-3">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <div>
                  <span className="text-xs uppercase tracking-wide text-[var(--color-ink-soft)]">
                    Chapter {chapter.number}
                  </span>
                  <h2 className="font-arabic text-xl">{chapter.titleArabic}</h2>
                  <p className="text-sm text-[var(--color-ink-soft)]">{chapter.titleEnglish}</p>
                </div>
                {chapter.isPlaceholder ? (
                  <span className="rounded-full border border-dashed border-amber-400 px-2 py-1 text-xs text-amber-700">
                    Placeholder
                  </span>
                ) : (
                  <span className="text-xs text-[var(--color-ink-soft)]">
                    {doneCount}/{chapter.lessons.length} lessons complete
                  </span>
                )}
              </div>
              <p className="text-sm text-[var(--color-ink-soft)]">{chapter.description}</p>
              <ul className="flex flex-col gap-1.5">
                {chapter.lessons.map((lesson) => (
                  <li key={lesson.id}>
                    <Link
                      to={`/lesson/${lesson.id}`}
                      className="flex items-center justify-between rounded-lg border border-transparent px-3 py-2 text-sm hover:border-[var(--color-border)] hover:bg-[var(--color-accent-soft)]/50"
                    >
                      <span className="flex items-center gap-2">
                        <span
                          className={`inline-block h-2 w-2 rounded-full ${
                            lessonsCompleted.includes(lesson.id) ? 'bg-emerald-500' : 'bg-[var(--color-border)]'
                          }`}
                        />
                        <span className="font-arabic text-base">{lesson.titleArabic}</span>
                        <span className="text-[var(--color-ink-soft)]">· {lesson.titleEnglish}</span>
                      </span>
                      {lesson.isPlaceholder && (
                        <span className="text-xs text-amber-700">placeholder</span>
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
