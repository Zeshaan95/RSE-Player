import type { StateStorage } from 'zustand/middleware'
import { namespacedKey } from './storage'

/**
 * Storage engine for zustand's `persist` middleware, shared by every store
 * in /src/store. zustand's own `createJSONStorage` wrapper already handles
 * JSON serialization of the store state, so this adapter's job is only to
 * move an already-serialized string in and out of the browser - swapping
 * it for a REST- or IndexedDB-backed implementation later needs no changes
 * to any store.
 */
export const zustandKvStorage: StateStorage = {
  getItem: (name) => {
    try {
      return window.localStorage.getItem(namespacedKey(name))
    } catch {
      return null
    }
  },
  setItem: (name, value) => {
    try {
      window.localStorage.setItem(namespacedKey(name), value)
    } catch {
      // Storage full or unavailable (e.g. private browsing) - fail silently
      // rather than crash a study session.
    }
  },
  removeItem: (name) => {
    try {
      window.localStorage.removeItem(namespacedKey(name))
    } catch {
      // ignore
    }
  },
}
