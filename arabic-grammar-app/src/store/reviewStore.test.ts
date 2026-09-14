import { beforeEach, describe, expect, it } from 'vitest'
import { useReviewStore } from './reviewStore'

function resetStore() {
  useReviewStore.setState({ items: {}, answerLog: [] })
}

describe('reviewStore - answer submission', () => {
  beforeEach(resetStore)

  it('creates and schedules an item on first rating, logging the answer', () => {
    const updated = useReviewStore.getState().rate('memorisation', 'sec-1', 'l1', 'c1', 'good')
    expect(updated.intervalDays).toBe(3)

    const stored = useReviewStore.getState().getItem('memorisation', 'sec-1')
    expect(stored?.intervalDays).toBe(3)

    const log = useReviewStore.getState().answerLog
    expect(log).toHaveLength(1)
    expect(log[0]).toMatchObject({ itemType: 'memorisation', refId: 'sec-1', confidence: 'good', correct: true })
  })

  it('records an incorrect (again) answer as not correct', () => {
    useReviewStore.getState().rate('recall', 'q1', 'l1', 'c1', 'again')
    const log = useReviewStore.getState().answerLog
    expect(log[0].correct).toBe(false)
  })

  it('ensureItem is idempotent and does not overwrite an existing record', () => {
    useReviewStore.getState().rate('recall', 'q1', 'l1', 'c1', 'easy')
    const beforeInterval = useReviewStore.getState().getItem('recall', 'q1')?.intervalDays
    useReviewStore.getState().ensureItem('recall', 'q1', 'l1', 'c1')
    const afterInterval = useReviewStore.getState().getItem('recall', 'q1')?.intervalDays
    expect(afterInterval).toBe(beforeInterval)
  })

  it('manual status override changes status without going through the SRS rating flow', () => {
    useReviewStore.getState().setStatus('memorisation', 'sec-1', 'l1', 'c1', 'mastered')
    expect(useReviewStore.getState().getItem('memorisation', 'sec-1')?.status).toBe('mastered')
  })
})

describe('reviewStore - memorisation progress', () => {
  beforeEach(resetStore)

  it('reports mastered vs total memorisation items correctly', () => {
    useReviewStore.getState().ensureItem('memorisation', 'sec-1', 'l1', 'c1')
    useReviewStore.getState().ensureItem('memorisation', 'sec-2', 'l1', 'c1')
    useReviewStore.getState().setStatus('memorisation', 'sec-1', 'l1', 'c1', 'mastered')

    const items = Object.values(useReviewStore.getState().items).filter((i) => i.itemType === 'memorisation')
    const mastered = items.filter((i) => i.status === 'mastered')
    expect(items).toHaveLength(2)
    expect(mastered).toHaveLength(1)
  })
})
