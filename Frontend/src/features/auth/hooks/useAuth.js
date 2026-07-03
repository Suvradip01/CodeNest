/**
 * useAuth — thin re-export of the global Zustand auth store.
 *
 * Drop-in replacement for the old context-based useAuth.
 * Components no longer need to be wrapped in AuthProvider.
 */
export { useAuthStore as useAuth } from '../../../store/useAuthStore'
