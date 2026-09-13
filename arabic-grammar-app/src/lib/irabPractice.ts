import type { IrabExercise, IrabLevel, IrabToken } from '@/types'

export type IrabPromptMode = 'wordType' | 'case' | 'role' | 'fullIrab'

export interface IrabPrompt {
  exerciseId: string
  lessonId: string
  sentenceArabic: string
  translation: string
  token: IrabToken
  tokenIndex: number
  mode: IrabPromptMode
}

const MODE_BY_LEVEL: Record<IrabLevel, IrabPromptMode> = {
  1: 'wordType',
  2: 'case',
  3: 'role',
  4: 'fullIrab',
  5: 'fullIrab',
}

export const LEVEL_DESCRIPTIONS: Record<IrabLevel, { title: string; description: string }> = {
  1: { title: 'Identify the word type', description: 'Is each word اسم (noun), فعل (verb), or حرف (particle)?' },
  2: { title: 'Identify the grammatical case', description: 'Is the word مرفوع، منصوب، مجرور، or مجزوم؟' },
  3: { title: 'Identify the grammatical role', description: 'What role does the word play - فاعل، مفعول به...؟' },
  4: { title: 'Give the full iʿrāb', description: 'Produce the complete traditional iʿrāb statement for each word.' },
  5: { title: 'Analyse complex sentences', description: 'Apply full iʿrāb to longer, multi-clause sentences.' },
}

export function buildIrabPrompts(exercises: IrabExercise[], level: IrabLevel): IrabPrompt[] {
  const mode = MODE_BY_LEVEL[level]
  const prompts: IrabPrompt[] = []
  for (const ex of exercises.filter((e) => e.level === level)) {
    ex.tokens.forEach((token, tokenIndex) => {
      if (mode === 'wordType') {
        prompts.push({ exerciseId: ex.id, lessonId: ex.lessonId, sentenceArabic: ex.sentenceArabic, translation: ex.translation, token, tokenIndex, mode })
      } else if (mode === 'case' && token.grammaticalCase) {
        prompts.push({ exerciseId: ex.id, lessonId: ex.lessonId, sentenceArabic: ex.sentenceArabic, translation: ex.translation, token, tokenIndex, mode })
      } else if (mode === 'role' && token.role) {
        prompts.push({ exerciseId: ex.id, lessonId: ex.lessonId, sentenceArabic: ex.sentenceArabic, translation: ex.translation, token, tokenIndex, mode })
      } else if (mode === 'fullIrab' && token.fullIrab) {
        prompts.push({ exerciseId: ex.id, lessonId: ex.lessonId, sentenceArabic: ex.sentenceArabic, translation: ex.translation, token, tokenIndex, mode })
      }
    })
  }
  return prompts
}

export const CASE_OPTIONS = ['مرفوع', 'منصوب', 'مجرور', 'مجزوم'] as const
export const WORD_TYPE_OPTIONS = ['اسم', 'فعل', 'حرف'] as const
