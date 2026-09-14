import { describe, expect, it } from 'vitest'
import { createReviewItem } from './srs'
import { buildReviewQueue, dueCounts, newCount } from './reviewQueue'
import type { ReviewItem } from '@/types'

const NOW = new Date('2026-01-01T09:00:00.000Z')

function due(item: ReviewItem, minutesAgo: number): ReviewItem {
  return { ...item, dueAt: new Date(NOW.getTime() - minutesAgo * 60 * 1000).toISOString() }
}

describe('buildReviewQueue', () => {
  it('caps each bucket at the configured session size', () => {
    const items: ReviewItem[] = [
      due(createReviewItem('memorisation', 'm1', 'l1', 'c1', NOW), 10),
      due(createReviewItem('memorisation', 'm2', 'l1', 'c1', NOW), 20),
      due(createReviewItem('memorisation', 'm3', 'l1', 'c1', NOW), 30),
      due(createReviewItem('recall', 'r1', 'l1', 'c1', NOW), 10),
      due(createReviewItem('irab', 'i1', 'l1', 'c1', NOW), 10),
    ]
    const queue = buildReviewQueue(items, new Set(), { memorisation: 2, grammar: 5, irab: 5 }, NOW)
    expect(queue.memorisation).toHaveLength(2)
    expect(queue.grammar).toHaveLength(1)
    expect(queue.irab).toHaveLength(1)
  })

  it('surfaces bookmarked/difficult items ahead of older-but-undifficult ones', () => {
    const old = due(createReviewItem('recall', 'r-old', 'l1', 'c1', NOW), 100)
    const difficult = due(createReviewItem('recall', 'r-difficult', 'l1', 'c1', NOW), 5)
    const queue = buildReviewQueue([old, difficult], new Set(['r-difficult']), { memorisation: 5, grammar: 5, irab: 5 }, NOW)
    expect(queue.grammar[0].refId).toBe('r-difficult')
    expect(queue.grammar[1].refId).toBe('r-old')
  })

  it('excludes items that are not yet due', () => {
    const notDue = createReviewItem('memorisation', 'future', 'l1', 'c1', new Date(NOW.getTime() + 100000))
    const queue = buildReviewQueue([notDue], new Set(), { memorisation: 5, grammar: 5, irab: 5 }, NOW)
    expect(queue.memorisation).toHaveLength(0)
  })
})

describe('dueCounts / newCount', () => {
  it('counts due items per type', () => {
    const items: ReviewItem[] = [
      due(createReviewItem('memorisation', 'm1', 'l1', 'c1', NOW), 5),
      due(createReviewItem('recall', 'r1', 'l1', 'c1', NOW), 5),
      due(createReviewItem('irab', 'i1', 'l1', 'c1', NOW), 5),
    ]
    const counts = dueCounts(items, NOW)
    expect(counts.total).toBe(3)
    expect(counts.memorisation).toBe(1)
    expect(counts.recall).toBe(1)
    expect(counts.irab).toBe(1)
  })

  it('counts brand-new items', () => {
    const items = [createReviewItem('recall', 'r1', 'l1', 'c1', NOW)]
    expect(newCount(items)).toBe(1)
  })
})
