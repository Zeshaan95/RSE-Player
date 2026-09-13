import { describe, expect, it } from 'vitest'
import { LADDER_DAYS, createReviewItem, getDueItems, isDue, scheduleReview } from './srs'

const NOW = new Date('2026-01-01T09:00:00.000Z')

function daysBetween(a: string, b: string): number {
  return Math.round((new Date(b).getTime() - new Date(a).getTime()) / (1000 * 60 * 60 * 24))
}

describe('createReviewItem', () => {
  it('creates a new item due immediately', () => {
    const item = createReviewItem('memorisation', 'sec-1', 'l1', 'c1', NOW)
    expect(item.status).toBe('new')
    expect(item.repetitions).toBe(0)
    expect(item.intervalDays).toBe(0)
    expect(isDue(item, NOW)).toBe(true)
  })
})

describe('scheduleReview - initial ratings on a brand-new item', () => {
  it('again reschedules for later the same day', () => {
    const item = createReviewItem('recall', 'q1', 'l1', 'c1', NOW)
    const updated = scheduleReview(item, 'again', NOW)
    expect(updated.intervalDays).toBe(0)
    expect(new Date(updated.dueAt).getTime()).toBeGreaterThan(NOW.getTime())
    expect(new Date(updated.dueAt).getTime()).toBeLessThan(NOW.getTime() + 60 * 60 * 1000)
    expect(updated.status).toBe('learning')
  })

  it('difficult schedules 1 day out', () => {
    const item = createReviewItem('recall', 'q1', 'l1', 'c1', NOW)
    const updated = scheduleReview(item, 'difficult', NOW)
    expect(updated.intervalDays).toBe(1)
    expect(daysBetween(NOW.toISOString(), updated.dueAt)).toBe(1)
  })

  it('good schedules 3 days out', () => {
    const item = createReviewItem('recall', 'q1', 'l1', 'c1', NOW)
    const updated = scheduleReview(item, 'good', NOW)
    expect(updated.intervalDays).toBe(3)
    expect(daysBetween(NOW.toISOString(), updated.dueAt)).toBe(3)
  })

  it('easy schedules 7 days out', () => {
    const item = createReviewItem('recall', 'q1', 'l1', 'c1', NOW)
    const updated = scheduleReview(item, 'easy', NOW)
    expect(updated.intervalDays).toBe(7)
    expect(daysBetween(NOW.toISOString(), updated.dueAt)).toBe(7)
  })
})

describe('scheduleReview - progressive ladder on repeated good ratings', () => {
  it('climbs 1 -> 3 -> 7 -> 14 -> 30 -> 60 -> 90 days', () => {
    // A "difficult" first rating is what actually lands a new item on rung
    // 0 (1 day) per the spec's initial mapping; from there, consecutive
    // "good" ratings should walk every remaining rung of the ladder in order.
    let item = createReviewItem('memorisation', 'sec-1', 'l1', 'c1', NOW)
    item = scheduleReview(item, 'difficult', NOW)
    const seenIntervals: number[] = [item.intervalDays]
    for (let i = 1; i < LADDER_DAYS.length; i++) {
      item = scheduleReview(item, 'good', NOW)
      seenIntervals.push(item.intervalDays)
    }
    expect(seenIntervals).toEqual([...LADDER_DAYS])
  })

  it('marks an item mastered once it has climbed the whole ladder', () => {
    let item = createReviewItem('memorisation', 'sec-1', 'l1', 'c1', NOW)
    item = scheduleReview(item, 'difficult', NOW)
    for (let i = 1; i < LADDER_DAYS.length; i++) {
      item = scheduleReview(item, 'good', NOW)
    }
    expect(item.status).toBe('mastered')
  })
})

describe('scheduleReview - forgetting reduces the interval', () => {
  it('an "again" rating on a learned item drops it back and flags it as needing review', () => {
    let item = createReviewItem('memorisation', 'sec-1', 'l1', 'c1', NOW)
    item = scheduleReview(item, 'good', NOW) // -> 3 days, status 'review'
    item = scheduleReview(item, 'good', NOW) // -> 7 days
    expect(item.status).toBe('review')

    const lapsedItem = scheduleReview(item, 'again', NOW)
    expect(lapsedItem.intervalDays).toBe(0)
    expect(lapsedItem.repetitions).toBe(0)
    expect(lapsedItem.status).toBe('needs_review')
    expect(lapsedItem.lapses).toBe(item.lapses + 1)
  })

  it('a "difficult" rating steps back one rung rather than resetting fully', () => {
    let item = createReviewItem('memorisation', 'sec-1', 'l1', 'c1', NOW)
    item = scheduleReview(item, 'good', NOW) // rung 1 -> 3 days
    item = scheduleReview(item, 'good', NOW) // rung 2 -> 7 days
    const steppedBack = scheduleReview(item, 'difficult', NOW)
    expect(steppedBack.intervalDays).toBe(3) // back to the previous rung
    expect(steppedBack.intervalDays).toBeLessThan(item.intervalDays)
  })
})

describe('isDue / getDueItems', () => {
  it('treats an item due exactly now as due', () => {
    const item = createReviewItem('recall', 'q1', 'l1', 'c1', NOW)
    expect(isDue(item, NOW)).toBe(true)
  })

  it('excludes items scheduled for the future', () => {
    const item = createReviewItem('recall', 'q1', 'l1', 'c1', NOW)
    const scheduled = scheduleReview(item, 'easy', NOW)
    expect(isDue(scheduled, NOW)).toBe(false)
  })

  it('sorts due items with the oldest due date first', () => {
    const a = { ...createReviewItem('recall', 'q1', 'l1', 'c1', NOW), dueAt: new Date(NOW.getTime() - 1000).toISOString() }
    const b = { ...createReviewItem('recall', 'q2', 'l1', 'c1', NOW), dueAt: new Date(NOW.getTime() - 5000).toISOString() }
    const due = getDueItems([a, b], NOW)
    expect(due.map((d) => d.refId)).toEqual(['q2', 'q1'])
  })
})
