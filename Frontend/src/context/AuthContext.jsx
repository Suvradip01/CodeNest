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
} from '../services/api'
import { getApiErrorMessage } from '../lib/utils'

export const AuthContext = createContext(null)

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

  // Bootstrap Health & Session Check
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

    return () => {
      ignore = true
    }
  }, [])

  // Redirect to landing if session is lost
  useEffect(() => {
    if (!session?.token && location.pathname !== '/') {
      navigate('/')
      setAuthMode('login')
      setIsAuthOpen(true)
      setAuthError('Sign in or create an account to continue.')
    }
  }, [session?.token, location.pathname, navigate])

  const openAuth = useCallback((mode = 'login') => {
    setAuthMode(mode)
    setAuthError('')
    setIsAuthOpen(true)
  }, [])

  const handleLaunchWorkspace = useCallback(() => {
    if (authConfig.loading) return

    if (!session?.token) {
      openAuth('register')
      return
    }

    navigate('/desktop')
  }, [authConfig.loading, openAuth, session?.token, navigate])

  const handleLaunchEditor = useCallback(() => {
    if (authConfig.loading) return

    if (!session?.token) {
      openAuth('login')
      return
    }

    navigate('/dashboard')
  }, [authConfig.loading, openAuth, session?.token, navigate])

  const handleAuthSubmit = useCallback(async ({ mode, name, email, password }) => {
    setIsSubmittingAuth(true)
    setAuthError('')

    try {
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
