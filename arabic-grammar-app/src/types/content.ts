/**
 * Content schema for the al-Ājurrūmiyyah curriculum.
 *
 * This describes the SHAPE of the study material, kept entirely separate
 * from application code. Real content lives under /content/chapters/*.json
 * and conforms to these types. Editing or expanding the curriculum never
 * requires touching a React component.
 */

/** A single key grammatical term introduced in a lesson. */
export interface KeyTerm {
  id: string
  arabic: string
  transliteration?: string
  english: string
  definition: string
}

/** A worked example sentence attached to a grammar rule or lesson. */
export interface Example {
  id: string
  /** The lesson this example illustrates. */
  lessonId: string
  arabicSentence: string
  translation: string
  /** Word-by-word grammatical breakdown, shown when the student asks for it. */
  componentBreakdown?: ExampleComponent[]
  /** The full traditional iʿrāb sentence, e.g. "زيدٌ: فاعلٌ مرفوعٌ...". */
  irabAnswer?: string
  difficulty: 1 | 2 | 3 | 4 | 5
  /** True for examples the student has added themselves. */
  isUserAdded?: boolean
  createdAt?: string
}

export interface ExampleComponent {
  word: string
  role: string
  grammaticalCase?: GrammaticalCase
  sign?: string
}

export type GrammaticalCase = 'مرفوع' | 'منصوب' | 'مجرور' | 'مجزوم' | 'مبني'

/** A retrieval-practice question tied to a lesson's rule. */
export interface RecallQuestion {
  id: string
  lessonId: string
  type: 'mcq' | 'free'
  questionArabic?: string
  questionEnglish: string
  /** Only present for type === 'mcq'. */
  options?: string[]
  /** Index into options for mcq, or the model free-text answer for free recall. */
  correctAnswer: string
  hint?: string
}

/** One passage of matn the student memorises and is tested on. */
export interface MemorisationSection {
  id: string
  lessonId: string
  order: number
  arabicText: string
  translation: string
  /** Transliteration is used sparingly, only to aid initial recitation. */
  transliteration?: string
}

export type IrabLevel = 1 | 2 | 3 | 4 | 5

/** One token of a sentence used in iʿrāb practice. */
export interface IrabToken {
  word: string
  /** e.g. اسم / فعل / حرف */
  wordType: string
  role?: string
  grammaticalCase?: GrammaticalCase
  /** The classical sign of the case ending, e.g. الضمة الظاهرة. */
  sign?: string
  /** Why the word takes this ending. */
  reason?: string
  /** The full traditional iʿrāb line for this single word. */
  fullIrab?: string
}

export interface IrabExercise {
  id: string
  lessonId: string
  level: IrabLevel
  sentenceArabic: string
  translation: string
  tokens: IrabToken[]
}

export interface Lesson {
  id: string
  chapterId: string
  order: number
  titleArabic: string
  titleEnglish: string
  /** The original matn text for this lesson, marked clearly as such in the UI. */
  matnArabic: string
  translation: string
  explanation: string
  keyTerms: KeyTerm[]
  examples: Example[]
  recallQuestions: RecallQuestion[]
  memorisationSections: MemorisationSection[]
  irabExercises: IrabExercise[]
  /**
   * When true, matnArabic/translation are placeholder text pending the
   * authentic text being inserted, and must be visually flagged as such.
   */
  isPlaceholder?: boolean
}

export interface Chapter {
  id: string
  number: number
  titleArabic: string
  titleEnglish: string
  description: string
  lessons: Lesson[]
  isPlaceholder?: boolean
}

export interface Curriculum {
  chapters: Chapter[]
}
