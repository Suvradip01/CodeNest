import { useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import Landing from './pages/Landing'
import DesktopView from './pages/DesktopView'
import DashboardView from './pages/DashboardView'
import ProtectedRoute from './components/ProtectedRoute'
import { ErrorBoundary } from './components/ErrorBoundary'
import Lenis from 'lenis'

// Root entry component establishing global state providers and navigation routers.
export default function App() {
  
  // Initialize Lenis buttery smooth scroll globally
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), 
      smoothWheel: true,
    })

    function raf(time) {
      lenis.raf(time)
      requestAnimationFrame(raf)
    }

    requestAnimationFrame(raf)

    return () => {
      lenis.destroy()
    }
  }, [])

  return (
    <Router>
      {/* Session manager supplying login, logout, and token recovery hooks */}
      <AuthProvider>
        {/* Crash recovery boundary to catch rendering errors inside dashboard panels */}
        <ErrorBoundary>
          <Routes>
            {/* Unprotected Landing marketing hub */}
            <Route path="/" element={<Landing />} />
            
            {/* Private desktop launchpad - gated by session validation */}
            <Route
              path="/desktop"
              element={
                <ProtectedRoute>
                  <DesktopView />
                </ProtectedRoute>
              }
            />
            
            {/* Private full IDE dashboard workspace - gated by session validation */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <DashboardView />
                </ProtectedRoute>
              }
            />
            
            {/* Catch-all wildcard redirecting unrecognized paths back to Landing */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </ErrorBoundary>
      </AuthProvider>
    </Router>
  )
}
