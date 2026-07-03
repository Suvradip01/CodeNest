/**
 * useVersionStore — Global Zustand version store with localStorage persistence.
 *
 * Replaces the custom `useVersionStore` React hook with a Zustand singleton
 * that uses the built-in `persist` middleware instead of manual
 * localStorage.getItem / setItem calls.
 *
 * Schema: { versions: [{ id, timestamp, language, code, label? }] }
 */
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const MAX_VERSIONS = 50
const STORAGE_KEY = 'codenest_versions'

function uid() {
  return Math.random().toString(36).slice(2, 10)
}

export const useVersionStore = create(
  persist(
    (set, get) => ({
      // ── State ────────────────────────────────────────────────────────────
      versions: [],

      // ── Actions ──────────────────────────────────────────────────────────
      /**
       * Saves a new snapshot and prunes old ones if MAX_VERSIONS is exceeded.
       * Returns the created snapshot.
       */
      saveSnapshot: (code, language, label) => {
        const snap = {
          id: uid(),
          timestamp: Date.now(),
          language,
          code,
          label: label || null,
        }
        set((s) => ({
          versions: [snap, ...s.versions].slice(0, MAX_VERSIONS),
        }))
        return snap
      },

      /** Removes a single snapshot by id. */
      deleteSnapshot: (id) => {
        set((s) => ({ versions: s.versions.filter((v) => v.id !== id) }))
      },

      /** Clears the entire version history. */
      clearAll: () => set({ versions: [] }),

      /** Attaches a label to an existing snapshot. */
      labelSnapshot: (id, label) => {
        set((s) => ({
          versions: s.versions.map((v) => (v.id === id ? { ...v, label } : v)),
        }))
      },
    }),
    {
      name: STORAGE_KEY,
      // Only persist the versions array — no need to persist actions
      partialize: (state) => ({ versions: state.versions }),
    }
  )
)
