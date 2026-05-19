// useVersionStore — manages code snapshots in localStorage for time-travel versioning
// Schema: { versions: [{ id, timestamp, language, code, label? }] }

import { useState, useCallback } from 'react'

const STORAGE_KEY = 'codenest_versions'
const MAX_VERSIONS = 50

function loadStore() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : { versions: [] }
  } catch {
    return { versions: [] }
  }
}

function saveStore(store) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store))
}

function uid() {
  return Math.random().toString(36).slice(2, 10)
}

// Hook that controls local code version snapshots, providing an in-browser git-like revision timeline.
export function useVersionStore() {
  const [store, setStore] = useState(loadStore)

  // Helper to run state updaters and immediately synchronize the versions array to local storage.
  const persist = useCallback((updater) => {
    setStore(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater
      saveStore(next)
      return next
    })
  }, [])

  // Saves a new programmatic snapshot and prunes older versions if maximum thresholds are crossed.
  const saveSnapshot = useCallback((code, language, label) => {
    const snap = { id: uid(), timestamp: Date.now(), language, code, label: label || null }
    persist(prev => {
      const versions = [snap, ...prev.versions].slice(0, MAX_VERSIONS)
      return { versions }
    })
    return snap
  }, [persist])

  // Removes a specific revision snapshot from history collections.
  const deleteSnapshot = useCallback((id) => {
    persist(prev => ({ versions: prev.versions.filter(v => v.id !== id) }))
  }, [persist])

  // Purges the entire programmatic version snapshot history.
  const clearAll = useCallback(() => {
    persist({ versions: [] })
  }, [persist])

  // Appends a custom text label to help identify a specific revision snapshot.
  const labelSnapshot = useCallback((id, label) => {
    persist(prev => ({
      versions: prev.versions.map(v => v.id === id ? { ...v, label } : v)
    }))
  }, [persist])

  return {
    versions: store.versions,
    saveSnapshot,
    deleteSnapshot,
    clearAll,
    labelSnapshot,
  }
}
