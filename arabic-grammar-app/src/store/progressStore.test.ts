import { beforeEach, describe, expect, it } from 'vitest'
import { useProgressStore } from './progressStore'

const DAY1 = new Date('2026-01-01T09:00:00.000Z')
const DAY2 = new Date('2026-01-02T09:00:00.000Z')
const DAY4 = new Date('2026-01-04T09:00:00.000Z') // gap of 2 days after DAY2

function resetStore() {
  const fresh = useProgressStore.getState()
  useProgressStore.setState({
    ...fresh,
    streakDays: 0,
    lastStudyDate: null,
    totalStudyMinutes: 0,
    studyMinutesByDate: {},
    lessonsCompleted: [],
    chaptersCompleted: [],
    conceptsMastered: [],
    difficultTopics: [],
    dailyGoalMinutes: 30,
  })
}

describe('progressStore - study streak calculation', () => {
  beforeEach(resetStore)

  it('starts a streak at 1 on the first study day', () => {
    useProgressStore.getState().recordStudyMinutes(10, DAY1)
    expect(useProgressStore.getState().streakDays).toBe(1)
  })

  it('does not double-count the streak for a second session the same day', () => {
    useProgressStore.getState().recordStudyMinutes(10, DAY1)
    useProgressStore.getState().recordStudyMinutes(5, DAY1)
    expect(useProgressStore.getState().streakDays).toBe(1)
    expect(useProgressStore.getState().totalStudyMinutes).toBe(15)
  })

  it('increments the streak on consecutive days', () => {
    useProgressStore.getState().recordStudyMinutes(10, DAY1)
    useProgressStore.getState().recordStudyMinutes(10, DAY2)
    expect(useProgressStore.getState().streakDays).toBe(2)
  })

  it('resets the streak to 1 after a gap of more than one day', () => {
    useProgressStore.getState().recordStudyMinutes(10, DAY1)
    useProgressStore.getState().recordStudyMinutes(10, DAY2)
    useProgressStore.getState().recordStudyMinutes(10, DAY4)
    expect(useProgressStore.getState().streakDays).toBe(1)
  })
})

describe('progressStore - progress calculation', () => {
  beforeEach(resetStore)

  it('tracks per-day study minutes independently of the running total', () => {
    useProgressStore.getState().recordStudyMinutes(20, DAY1)
    useProgressStore.getState().recordStudyMinutes(15, DAY2)
    const state = useProgressStore.getState()
    expect(state.totalStudyMinutes).toBe(35)
    expect(state.todayStudyMinutes(DAY2)).toBe(15)
  })

  it('marking a lesson completed is idempotent', () => {
    useProgressStore.getState().markLessonCompleted('ch1-l1')
    useProgressStore.getState().markLessonCompleted('ch1-l1')
    expect(useProgressStore.getState().lessonsCompleted).toEqual(['ch1-l1'])
  })

  it('enforces a sane minimum daily goal', () => {
    useProgressStore.getState().setDailyGoal(0)
    expect(useProgressStore.getState().dailyGoalMinutes).toBeGreaterThanOrEqual(5)
  })
})
