import { createContext, useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  clearStoredSession,
  fetchHealth,
  getCurrentUserApi,
  getStoredSession,
  loginUserApi,
  persistSession,
  registerUserApi,
  resetPasswordApi,
  updatePasswordApi,
} from '../services/api'
import { getApiErrorMessage } from '../lib/utils'

export const AuthContext = createContext(null)

// Provider component that encapsulates global authentication state, tokens, and active gateways.
export function AuthProvider({ children }) {
  const navigate = useNavigate()
  const location = useLocation()
  const initialSession = useRef(getStoredSession())
  const [authConfig, setAuthConfig] = useState({ loading: true, required: true })
  const [session, setSession] = useState(initialSession.current)
  const [isAuthOpen, setIsAuthOpen] = useState(false)
  const [authMode, setAuthMode] = useState('login')
  const [authError, setAuthError] = useState('')
  const [isSubmittingAuth, setIsSubmittingAuth] = useState(false)

  // Bootstrap: Verifies API health and attempts to restore a stored user session on load.
  useEffect(() => {
    let ignore = false

    async function bootstrap() {
      try {
        await fetchHealth()
        if (!ignore) {
          setAuthConfig({
            loading: false,
            required: true,
          })
        }
      } catch (error) {
        console.error('Health check failed:', error)
        if (!ignore) {
          setAuthConfig({ loading: false, required: true })
        }
      }

      if (!initialSession.current?.token) return

      try {
        const user = await getCurrentUserApi()
        if (ignore) return

        const hydratedSession = {
          ...initialSession.current,
          user,
        }
        persistSession(hydratedSession)
        setSession(hydratedSession)
      } catch (error) {
        console.error('Session restore failed:', error)
        clearStoredSession()
        if (!ignore) {
          setSession(null)
        }
      }
    }

    bootstrap()

    // Read URL query parameters on mount to boot password recovery mode if token is discovered.
    const params = new URLSearchParams(window.location.search)
    const token = params.get('resetToken')
    if (token) {
      setAuthMode('new-password')
      setIsAuthOpen(true)
    }

    return () => {
      ignore = true
    }
  }, [])

  // Session Sentinel: Redirects unauthorized users trying to access secure internal pages.
  useEffect(() => {
    if (!session?.token && location.pathname !== '/') {
      navigate('/')
      setAuthMode('login')
      setIsAuthOpen(true)
      setAuthError('Sign in or create an account to continue.')
    }
  }, [session?.token, location.pathname, navigate])

  // Open the login, registration, or password recovery dialog.
  const openAuth = useCallback((mode = 'login') => {
    setAuthMode(mode)
    setAuthError('')
    setIsAuthOpen(true)
  }, [])

  // Workspace Launcher: Route guard allowing entry only if the user is authenticated.
  const handleLaunchWorkspace = useCallback(() => {
    if (authConfig.loading) return

    if (!session?.token) {
      openAuth('register')
      return
    }

    navigate('/desktop')
  }, [authConfig.loading, openAuth, session?.token, navigate])

  // Editor Launcher: Route guard ensuring authenticated entry directly to the IDE.
  const handleLaunchEditor = useCallback(() => {
    if (authConfig.loading) return

    if (!session?.token) {
      openAuth('login')
      return
    }

    navigate('/dashboard')
  }, [authConfig.loading, openAuth, session?.token, navigate])

  // Primary Dispatcher: Coordinates server requests for Login, Registration, Password Reset, and Password Update.
  const handleAuthSubmit = useCallback(async ({ mode, name, email, password }) => {
    setIsSubmittingAuth(true)
    setAuthError('')

    try {
      // Password Recovery Flow: request a secure single-use recovery token email.
      if (mode === 'reset') {
        await resetPasswordApi({ email })
        return { success: true, mode: 'reset' }
      }

      // Password Update Flow: exchange token query parameter for active credential update.
      if (mode === 'new-password') {
        const params = new URLSearchParams(window.location.search)
        const token = params.get('resetToken')
        await updatePasswordApi({ token, password })
        
        // Sanitize URL state immediately after successful update to prevent token leakage.
        window.history.replaceState({}, document.title, window.location.pathname)
        
        return { success: true, mode: 'new-password' }
      }

      const nextSession = mode === 'register'
        ? await registerUserApi({ name, email, password })
        : await loginUserApi({ email, password })

      persistSession(nextSession)
      setSession(nextSession)
      setIsAuthOpen(false)

      if (location.pathname === '/') {
        navigate('/desktop')
      }
      return { success: true, mode }
    } catch (error) {
      const { message } = getApiErrorMessage(error, 'Authentication failed')
      setAuthError(message)
      return { success: false, error: message }
    } finally {
      setIsSubmittingAuth(false)
    }
  }, [navigate, location.pathname])

  // Session Terminating: Clears all local storage contexts and redirects to landing.
  const handleLogout = useCallback(() => {
    clearStoredSession()
    setSession(null)
    setIsAuthOpen(false)
    navigate('/')
  }, [navigate])

  const value = {
    authConfig,
    session,
    setSession,
    isAuthOpen,
    setIsAuthOpen,
    authMode,
    setAuthMode,
    authError,
    setAuthError,
    isSubmittingAuth,
    openAuth,
    handleLaunchWorkspace,
    handleLaunchEditor,
    handleAuthSubmit,
    handleLogout,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
