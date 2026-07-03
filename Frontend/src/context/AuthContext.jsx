/**
 * AuthContext — legacy shim kept for backwards-compatibility.
 *
 * The real auth state now lives in the global Zustand store (useAuthStore).
 * This file exports a no-op context so any components that still import
 * `AuthContext` directly won't crash. New code should use `useAuth` from
 * `features/auth/hooks/useAuth` which points directly to the Zustand store.
 *
 * AuthProvider now only handles the one-time bootstrap side-effect
 * (health check + session restore) and no longer owns any state.
 */
import { createContext, useEffect } from 'react'
import { useAuthStore } from '../store/useAuthStore'

// Legacy context — kept so any direct AuthContext.Consumer still compiles.
export const AuthContext = createContext(null)

/**
 * AuthProvider — now a pure side-effect shell.
 * Runs the bootstrap action (health check + session restore) once on mount.
 * All state is owned by useAuthStore.
 */
export function AuthProvider({ children }) {
  const bootstrap = useAuthStore((s) => s.bootstrap)

  useEffect(() => {
    bootstrap()
  }, [bootstrap])

  return children
}
