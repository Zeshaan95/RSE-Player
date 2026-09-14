import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import type { IrabLevel, UserProgress } from '@/types'
import { zustandKvStorage } from '@/lib/zustandStorage'
import { STORAGE_KEYS } from '@/lib/storage'
import { dateKey, daysBetween } from '@/lib/date'

function emptyIrabSkill() {
  return { attempts: 0, correct: 0 }
}

function initialProgress(): UserProgress {
  return {
    streakDays: 0,
    lastStudyDate: null,
    totalStudyMinutes: 0,
    studyMinutesByDate: {},
    chaptersCompleted: [],
    lessonsCompleted: [],
    conceptsMastered: [],
    difficultTopics: [],
    forgottenTopics: [],
    longestRetentionDays: 0,
    irabSkillProgress: {
      1: { level: 1, ...emptyIrabSkill() },
      2: { level: 2, ...emptyIrabSkill() },
      3: { level: 3, ...emptyIrabSkill() },
      4: { level: 4, ...emptyIrabSkill() },
      5: { level: 5, ...emptyIrabSkill() },
    },
    irabAccuracyOverall: { attempts: 0, correct: 0 },
    reviewAccuracy: { attempts: 0, correct: 0 },
    dailyGoalMinutes: 30,
    currentChapterId: null,
    currentLessonId: null,
  }
}

interface ProgressState extends UserProgress {
  recordStudyMinutes: (minutes: number, now?: Date) => void
  markLessonCompleted: (lessonId: string) => void
  markChapterCompleted: (chapterId: string) => void
  markConceptMastered: (conceptId: string) => void
  addDifficultTopic: (refId: string) => void
  removeDifficultTopic: (refId: string) => void
  addForgottenTopic: (refId: string) => void
  recordIrabAttempt: (level: IrabLevel, correct: boolean) => void
  recordReviewAttempt: (correct: boolean) => void
  noteRetentionInterval: (days: number) => void
  setDailyGoal: (minutes: number) => void
  setCurrentLesson: (chapterId: string, lessonId: string) => void
  todayStudyMinutes: (now?: Date) => number
}

export const useProgressStore = create<ProgressState>()(
  persist(
    (set, get) => ({
      ...initialProgress(),

      recordStudyMinutes: (minutes, now = new Date()) => {
        if (minutes <= 0) return
        const today = dateKey(now)
        set((s) => {
          const prevMinutesToday = s.studyMinutesByDate[today] ?? 0
          let streakDays = s.streakDays
          if (s.lastStudyDate === null) {
            streakDays = 1
          } else if (s.lastStudyDate !== today) {
            const gap = daysBetween(s.lastStudyDate, today)
            streakDays = gap === 1 ? s.streakDays + 1 : gap === 0 ? s.streakDays : 1
          }
          return {
            totalStudyMinutes: s.totalStudyMinutes + minutes,
            studyMinutesByDate: { ...s.studyMinutesByDate, [today]: prevMinutesToday + minutes },
            lastStudyDate: today,
            streakDays,
          }
        })
      },

      markLessonCompleted: (lessonId) => {
        set((s) =>
          s.lessonsCompleted.includes(lessonId)
            ? s
            : { lessonsCompleted: [...s.lessonsCompleted, lessonId] },
        )
      },

      markChapterCompleted: (chapterId) => {
        set((s) =>
          s.chaptersCompleted.includes(chapterId)
            ? s
            : { chaptersCompleted: [...s.chaptersCompleted, chapterId] },
        )
      },

      markConceptMastered: (conceptId) => {
        set((s) =>
          s.conceptsMastered.includes(conceptId)
            ? s
            : { conceptsMastered: [...s.conceptsMastered, conceptId] },
        )
      },

      addDifficultTopic: (refId) => {
        set((s) => (s.difficultTopics.includes(refId) ? s : { difficultTopics: [...s.difficultTopics, refId] }))
      },

      removeDifficultTopic: (refId) => {
        set((s) => ({ difficultTopics: s.difficultTopics.filter((t) => t !== refId) }))
      },

      addForgottenTopic: (refId) => {
        set((s) => (s.forgottenTopics.includes(refId) ? s : { forgottenTopics: [...s.forgottenTopics, refId] }))
      },

      recordIrabAttempt: (level, correct) => {
        set((s) => {
          const cur = s.irabSkillProgress[level]
          const overall = s.irabAccuracyOverall
          return {
            irabSkillProgress: {
              ...s.irabSkillProgress,
              [level]: { ...cur, attempts: cur.attempts + 1, correct: cur.correct + (correct ? 1 : 0) },
            },
            irabAccuracyOverall: { attempts: overall.attempts + 1, correct: overall.correct + (correct ? 1 : 0) },
          }
        })
      },

      recordReviewAttempt: (correct) => {
        set((s) => ({
          reviewAccuracy: {
            attempts: s.reviewAccuracy.attempts + 1,
            correct: s.reviewAccuracy.correct + (correct ? 1 : 0),
          },
        }))
      },

      noteRetentionInterval: (days) => {
        set((s) => (days > s.longestRetentionDays ? { longestRetentionDays: days } : s))
      },

      setDailyGoal: (minutes) => set({ dailyGoalMinutes: Math.max(5, minutes) }),

      setCurrentLesson: (chapterId, lessonId) => set({ currentChapterId: chapterId, currentLessonId: lessonId }),

      todayStudyMinutes: (now = new Date()) => get().studyMinutesByDate[dateKey(now)] ?? 0,
    }),
    {
      name: STORAGE_KEYS.progress,
      storage: createJSONStorage(() => zustandKvStorage),
    },
  ),
)
