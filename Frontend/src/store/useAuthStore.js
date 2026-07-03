/**
 * useAuthStore — Global Zustand auth store.
 *
 * Replaces AuthContext + AuthProvider with a singleton store accessible from
 * any component without prop-drilling or context nesting.
 *
 * Navigation side-effects (redirect on login/logout) are handled by passing
 * a `navigate` function (from useNavigate) into action calls, so the store
 * itself stays framework-agnostic and testable without a Router.
 */
import { create } from 'zustand'
import {
  clearStoredSession,
  getCurrentUserApi,
  getStoredSession,
  loginUserApi,
  persistSession,
  registerUserApi,
  resetPasswordApi,
  updatePasswordApi,
} from '../features/auth/api'
import { fetchHealth } from '../services/api'
import { getApiErrorMessage } from '../lib/utils'

// ---------------------------------------------------------------------------
// Store definition
// ---------------------------------------------------------------------------
export const useAuthStore = create((set, get) => ({
  // ── State ─────────────────────────────────────────────────────────────────
  /** { loading: boolean, required: boolean } */
  authConfig: { loading: true, required: true },
  /** { token: string, user: object } | null */
  session: getStoredSession(),
  /** Whether the auth modal is visible */
  isAuthOpen: false,
  /** 'login' | 'register' | 'reset' | 'new-password' */
  authMode: 'login',
  /** Error message string for the auth form */
  authError: '',
  /** True while an auth API request is in-flight */
  isSubmittingAuth: false,

  // ── Internal setters (used by bootstrap & external effects) ───────────────
  setAuthConfig: (authConfig) => set({ authConfig }),
  setSession: (session) => set({ session }),
  setIsAuthOpen: (isAuthOpen) => set({ isAuthOpen }),
  setAuthMode: (authMode) => set({ authMode }),
  setAuthError: (authError) => set({ authError }),
  setIsSubmittingAuth: (isSubmittingAuth) => set({ isSubmittingAuth }),

  // ── Bootstrap ─────────────────────────────────────────────────────────────
  /**
   * Call once on app mount (inside AuthProvider).
   * Verifies backend health, restores a stored session, and handles the
   * password-reset token URL param.
   */
  bootstrap: async () => {
    // Warm up the backend without blocking the UI
    fetchHealth().catch((error) => {
      console.error('Background health check failed:', error)
    })

    const initialSession = get().session

    if (!initialSession?.token) {
      set({ authConfig: { loading: false, required: true } })
      // Handle password-reset flow from URL token
      const params = new URLSearchParams(window.location.search)
      const token = params.get('resetToken')
      if (token) set({ authMode: 'new-password', isAuthOpen: true })
      return
    }

    try {
      const user = await getCurrentUserApi()
      const hydratedSession = { ...initialSession, user }
      persistSession(hydratedSession)
      set({ session: hydratedSession })
    } catch (error) {
      console.error('Session restore failed:', error)
      clearStoredSession()
      set({ session: null })
    } finally {
      set({ authConfig: { loading: false, required: true } })
    }

    // Handle password-reset flow from URL token
    const params = new URLSearchParams(window.location.search)
    const token = params.get('resetToken')
    if (token) set({ authMode: 'new-password', isAuthOpen: true })
  },

  // ── UI actions ────────────────────────────────────────────────────────────
  /** Open auth modal and pre-select a mode (default: 'login'). */
  openAuth: (mode = 'login') => {
    set({ authMode: mode, authError: '', isAuthOpen: true })
  },

  // ── Route guards ──────────────────────────────────────────────────────────
  /**
   * Workspace Launcher: navigates to /desktop if authenticated, else opens
   * the register modal. Pass the `navigate` function from `useNavigate()`.
   */
  handleLaunchWorkspace: (navigate) => {
    const { authConfig, session, openAuth } = get()
    if (authConfig.loading) return
    if (!session?.token) {
      openAuth('register')
      return
    }
    navigate('/desktop')
  },

  /**
   * Editor Launcher: navigates to /dashboard if authenticated, else opens
   * the login modal. Pass the `navigate` function from `useNavigate()`.
   */
  handleLaunchEditor: (navigate) => {
    const { authConfig, session, openAuth } = get()
    if (authConfig.loading) return
    if (!session?.token) {
      openAuth('login')
      return
    }
    navigate('/dashboard')
  },

  // ── Auth submission ───────────────────────────────────────────────────────
  /**
   * Primary dispatcher for login, register, reset, and new-password flows.
   * Pass `navigate` (from useNavigate) and `currentPath` (location.pathname)
   * so it can redirect after a successful login.
   * Returns { success: boolean, mode?: string, error?: string }.
   */
  handleAuthSubmit: async ({ mode, name, email, password, navigate, currentPath }) => {
    set({ isSubmittingAuth: true, authError: '' })

    try {
      // Password Recovery: request a one-time email reset link
      if (mode === 'reset') {
        await resetPasswordApi({ email })
        return { success: true, mode: 'reset' }
      }

      // Password Update: exchange URL token for a new credential
      if (mode === 'new-password') {
        const params = new URLSearchParams(window.location.search)
        const token = params.get('resetToken')
        await updatePasswordApi({ token, password })
        // Sanitize URL to prevent token leakage after update
        window.history.replaceState({}, document.title, window.location.pathname)
        return { success: true, mode: 'new-password' }
      }

      const nextSession =
        mode === 'register'
          ? await registerUserApi({ name, email, password })
          : await loginUserApi({ email, password })

      persistSession(nextSession)
      set({ session: nextSession, isAuthOpen: false })

      // Navigate to desktop after login/register if coming from landing page
      if (navigate && currentPath === '/') {
        navigate('/desktop')
      }

      return { success: true, mode }
    } catch (error) {
      const { message } = getApiErrorMessage(error, 'Authentication failed')
      set({ authError: message })
      return { success: false, error: message }
    } finally {
      set({ isSubmittingAuth: false })
    }
  },

  // ── Logout ────────────────────────────────────────────────────────────────
  /**
   * Clears session from memory and localStorage.
   * Pass the `navigate` function from `useNavigate()` to redirect to landing.
   */
  handleLogout: (navigate) => {
    clearStoredSession()
    set({ session: null, isAuthOpen: false })
    if (navigate) navigate('/')
  },
}))
