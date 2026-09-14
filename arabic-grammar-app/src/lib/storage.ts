/**
 * Persistence layer.
 *
 * Every read/write to the student's data goes through this thin
 * key-value abstraction rather than touching `localStorage` directly
 * anywhere else in the app. The public API is Promise-based on purpose:
 * a future backend (e.g. a REST API or IndexedDB) can implement the same
 * `KeyValueStore` interface and be swapped in without the stores or pages
 * changing at all.
 */

export interface KeyValueStore {
  get<T>(key: string): Promise<T | null>
  set<T>(key: string, value: T): Promise<void>
  remove(key: string): Promise<void>
}

const NAMESPACE = 'ajurrumiyyah'

/** Namespaces a logical key the same way for every reader/writer of this
 * browser's storage (the plain KeyValueStore below and the zustand
 * persist adapter alike), so both land on the same underlying key. */
export function namespacedKey(key: string): string {
  return `${NAMESPACE}:${key}`
}

class LocalStorageStore implements KeyValueStore {
  private nsKey(key: string): string {
    return namespacedKey(key)
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const raw = window.localStorage.getItem(this.nsKey(key))
      if (raw === null) return null
      return JSON.parse(raw) as T
    } catch {
      return null
    }
  }

  async set<T>(key: string, value: T): Promise<void> {
    try {
      window.localStorage.setItem(this.nsKey(key), JSON.stringify(value))
    } catch {
      // Storage full or unavailable (e.g. private browsing) - fail silently
      // rather than crash a study session.
    }
  }

  async remove(key: string): Promise<void> {
    try {
      window.localStorage.removeItem(this.nsKey(key))
    } catch {
      // ignore
    }
  }
}

export const store: KeyValueStore = new LocalStorageStore()

export const STORAGE_KEYS = {
  reviewItems: 'reviewItems',
  progress: 'progress',
  bookmarks: 'bookmarks',
  sessions: 'studySessions',
  settings: 'settings',
  userAnswers: 'userAnswers',
  userExamples: 'userExamples',
} as const
