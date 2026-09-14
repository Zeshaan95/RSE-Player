import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Card } from '@/components/Card'
import { ArabicText, ArabicInline } from '@/components/ArabicText'
import { ConfidenceButtons } from '@/components/ConfidenceButtons'
import { getAllIrabExercises, getChapterForLesson } from '@/lib/content'
import { CASE_OPTIONS, LEVEL_DESCRIPTIONS, WORD_TYPE_OPTIONS, buildIrabPrompts } from '@/lib/irabPractice'
import { useReviewStore } from '@/store/reviewStore'
import { useProgressStore } from '@/store/progressStore'
import type { ConfidenceRating, IrabLevel } from '@/types'

export function IrabPracticePage() {
  const { level: levelParam } = useParams<{ level: string }>()
  const level = Number(levelParam) as IrabLevel
  const info = LEVEL_DESCRIPTIONS[level]

  const exercises = useMemo(() => getAllIrabExercises(), [])
  const prompts = useMemo(() => buildIrabPrompts(exercises, level), [exercises, level])

  const [index, setIndex] = useState(0)
  const [selected, setSelected] = useState<string | null>(null)
  const [freeAnswer, setFreeAnswer] = useState('')
  const [revealed, setRevealed] = useState(false)
  const [correctCount, setCorrectCount] = useState(0)

  const rate = useReviewStore((s) => s.rate)
  const recordIrabAttempt = useProgressStore((s) => s.recordIrabAttempt)

  if (!info) return <p className="text-sm text-[var(--color-ink-soft)]">Unknown level.</p>

  if (prompts.length === 0 || index >= prompts.length) {
    return (
      <div className="flex flex-col gap-4">
        <Card className="text-center">
          <h1 className="text-xl font-semibold">
            {prompts.length === 0 ? 'No exercises at this level yet' : 'Level complete'}
          </h1>
          {prompts.length > 0 && (
            <p className="mt-1 text-sm text-[var(--color-ink-soft)]">
              {correctCount} of {prompts.length} correct.
            </p>
          )}
        </Card>
        <div className="flex justify-center gap-3">
          <Link to="/irab" className="rounded-lg border border-[var(--color-border)] px-4 py-2 text-sm hover:border-[var(--color-accent)]">
            Back to Iʿrāb levels
          </Link>
        </div>
      </div>
    )
  }

  const prompt = prompts[index]
  const chapter = getChapterForLesson(prompt.lessonId)
  const refId = `${prompt.exerciseId}:${prompt.tokenIndex}:${prompt.mode}`

  const isMcq = prompt.mode === 'wordType' || prompt.mode === 'case'
  const mcqOptions = prompt.mode === 'wordType' ? WORD_TYPE_OPTIONS : CASE_OPTIONS
  const mcqAnswer = prompt.mode === 'wordType' ? prompt.token.wordType : prompt.token.grammaticalCase
  const isMcqCorrect = selected === mcqAnswer

  function advance(correct: boolean) {
    recordIrabAttempt(level, correct)
    if (correct) setCorrectCount((c) => c + 1)
    setSelected(null)
    setFreeAnswer('')
    setRevealed(false)
    setIndex((i) => i + 1)
  }

  function handleMcqSubmit() {
    if (!selected) return
    setRevealed(true)
  }

  function handleMcqNext() {
    rate('irab', refId, prompt.lessonId, chapter?.id ?? '', isMcqCorrect ? 'good' : 'again')
    advance(isMcqCorrect)
  }

  function handleFreeRate(confidence: ConfidenceRating) {
    rate('irab', refId, prompt.lessonId, chapter?.id ?? '', confidence)
    advance(confidence !== 'again')
  }

  const promptQuestion =
    prompt.mode === 'wordType'
      ? `What type of word is this?`
      : prompt.mode === 'case'
        ? `What is the grammatical case (إعراب) of this word?`
        : prompt.mode === 'role'
          ? `What is the grammatical role of this word in the sentence?`
          : `Give the full iʿrāb of this word.`

  const revealAnswer =
    prompt.mode === 'role' ? prompt.token.role : prompt.mode === 'fullIrab' ? prompt.token.fullIrab : undefined

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <Link to="/irab" className="text-xs text-[var(--color-ink-soft)] hover:underline">
          ← Level {level}: {info.title}
        </Link>
        <span className="text-xs text-[var(--color-ink-soft)]">
          {index + 1} / {prompts.length}
        </span>
      </div>

      <Card className="flex flex-col gap-4">
        <div>
          <span className="mb-1 block text-xs text-[var(--color-ink-soft)]">Sentence</span>
          <ArabicText size="xl">{prompt.sentenceArabic}</ArabicText>
          <p className="text-sm text-[var(--color-ink-soft)]">{prompt.translation}</p>
        </div>

        <div className="rounded-lg bg-[var(--color-accent-soft)]/50 p-3">
          <p className="text-sm">
            {promptQuestion} — <ArabicInline className="text-lg font-medium">{prompt.token.word}</ArabicInline>
          </p>
        </div>

        {isMcq && (
          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap gap-2">
              {mcqOptions.map((opt) => (
                <button
                  key={opt}
                  type="button"
                  disabled={revealed}
                  onClick={() => setSelected(opt)}
                  className={`rounded-lg border px-4 py-2 font-arabic text-lg transition-colors ${
                    revealed && opt === mcqAnswer
                      ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30'
                      : revealed && opt === selected && opt !== mcqAnswer
                        ? 'border-rose-500 bg-rose-50 dark:bg-rose-950/30'
                        : selected === opt
                          ? 'border-[var(--color-accent)] bg-[var(--color-accent-soft)]'
                          : 'border-[var(--color-border)] hover:border-[var(--color-accent)]'
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
            {!revealed ? (
              <button
                type="button"
                disabled={!selected}
                onClick={handleMcqSubmit}
                className="self-start rounded-lg bg-[var(--color-accent)] px-4 py-2 text-sm font-medium text-white disabled:opacity-40"
              >
                Check answer
              </button>
            ) : (
              <button
                type="button"
                onClick={handleMcqNext}
                className="self-start rounded-lg bg-[var(--color-accent)] px-4 py-2 text-sm font-medium text-white"
              >
                Next →
              </button>
            )}
          </div>
        )}

        {!isMcq && (
          <div className="flex flex-col gap-3">
            <textarea
              value={freeAnswer}
              onChange={(e) => setFreeAnswer(e.target.value)}
              rows={2}
              disabled={revealed}
              placeholder={prompt.mode === 'fullIrab' ? 'e.g. فاعلٌ مرفوعٌ وعلامة رفعه...' : 'Type the grammatical role...'}
              className="font-arabic w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-paper)] p-3 text-lg focus:border-[var(--color-accent)] focus:outline-none"
              dir="rtl"
            />
            {!revealed ? (
              <button
                type="button"
                onClick={() => setRevealed(true)}
                className="self-start rounded-lg bg-[var(--color-accent)] px-4 py-2 text-sm font-medium text-white"
              >
                Reveal answer
              </button>
            ) : (
              <>
                <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-accent-soft)]/40 p-3">
                  <span className="mb-1 block text-xs uppercase tracking-wide text-[var(--color-ink-soft)]">
                    Model answer
                  </span>
                  <ArabicText size="base">{revealAnswer ?? ''}</ArabicText>
                </div>
                <div className="flex flex-col gap-2">
                  <span className="text-xs font-medium uppercase tracking-wide text-[var(--color-ink-soft)]">
                    How close was your answer?
                  </span>
                  <ConfidenceButtons onRate={handleFreeRate} />
                </div>
              </>
            )}
          </div>
        )}
      </Card>
    </div>
  )
}
