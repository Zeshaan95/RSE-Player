import { beforeEach, describe, expect, it, vi } from 'vitest'
import { store, STORAGE_KEYS } from '@/lib/storage'

function flush() {
  // Let the persist middleware's storage writes settle.
  return new Promise((resolve) => setTimeout(resolve, 0))
}

beforeEach(async () => {
  await store.remove(STORAGE_KEYS.progress)
  await store.remove(STORAGE_KEYS.reviewItems)
})

describe('persistence of user progress across a simulated reload', () => {
  it('survives a full reload: study minutes and completed lessons are read back from storage', async () => {
    const { useProgressStore } = await import('./progressStore')
    useProgressStore.getState().recordStudyMinutes(12, new Date('2026-01-01T09:00:00.000Z'))
    useProgressStore.getState().markLessonCompleted('ch1-l1')
    await flush()

    // Prove the write actually landed in localStorage, not just in memory.
    const raw = window.localStorage.getItem('ajurrumiyyah:' + STORAGE_KEYS.progress)
    expect(raw).toBeTruthy()
    expect(raw).toContain('ch1-l1')

    // Simulate a real page reload: reset the JS module graph (a fresh store,
    // fresh in-memory state) while leaving localStorage - the only thing a
    // real reload actually preserves - untouched.
    vi.resetModules()
    const { useProgressStore: reloaded } = await import('./progressStore')
    await reloaded.persist.rehydrate()

    expect(reloaded.getState().totalStudyMinutes).toBe(12)
    expect(reloaded.getState().lessonsCompleted).toContain('ch1-l1')
  })

  it('survives a full reload: SRS review items (status, interval, due date) are read back', async () => {
    const { useReviewStore } = await import('./reviewStore')
    useReviewStore.getState().rate('memorisation', 'sec-1', 'l1', 'c1', 'easy')
    await flush()

    const raw = window.localStorage.getItem('ajurrumiyyah:' + STORAGE_KEYS.reviewItems)
    expect(raw).toBeTruthy()

    vi.resetModules()
    const { useReviewStore: reloaded } = await import('./reviewStore')
    await reloaded.persist.rehydrate()

    const restored = reloaded.getState().getItem('memorisation', 'sec-1')
    expect(restored?.intervalDays).toBe(7)
    expect(restored?.status).toBe('mastered')
  })
})
