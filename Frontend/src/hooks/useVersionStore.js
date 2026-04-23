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

export function useVersionStore() {
  const [store, setStore] = useState(loadStore)

  const persist = useCallback((updater) => {
    setStore(prev => {
      const next = typeof updater === 'function' ? updater(prev) : updater
      saveStore(next)
      return next
    })
  }, [])

  // Save a new snapshot; auto-prune if over MAX_VERSIONS
  const saveSnapshot = useCallback((code, language, label) => {
    const snap = { id: uid(), timestamp: Date.now(), language, code, label: label || null }
    persist(prev => {
      const versions = [snap, ...prev.versions].slice(0, MAX_VERSIONS)
      return { versions }
    })
    return snap
  }, [persist])

  // Delete a single snapshot by id
  const deleteSnapshot = useCallback((id) => {
    persist(prev => ({ versions: prev.versions.filter(v => v.id !== id) }))
  }, [persist])

  // Clear all snapshots
  const clearAll = useCallback(() => {
    persist({ versions: [] })
  }, [persist])

  // Label a snapshot (e.g. "Before refactor")
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
