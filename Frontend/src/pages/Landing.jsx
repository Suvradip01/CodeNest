import React, { useEffect } from 'react'
import LandingPage from '../components/common/LandingPage'
import AuthDialog from '../features/auth/components/AuthDialog'
import { useAuth } from '../features/auth/hooks/useAuth'
import { AUTH_REQUIRED } from '../config/constants'
import Lenis from 'lenis'

// Entry point component that aggregates the presentation LandingPage container with security AuthDialog modals.
export default function Landing() {
  // Initialize Lenis smooth scroll specifically on the Landing marketing page
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
  const {
    session,
    authConfig,
    isAuthOpen,
    setIsAuthOpen,
    authMode,
    setAuthMode,
    authError,
    isSubmittingAuth,
    openAuth,
    handleLaunchWorkspace,
    handleAuthSubmit,
  } = useAuth()


  return (
    <>
      <LandingPage
        onLaunch={handleLaunchWorkspace}
        onSignIn={() => openAuth('login')}
        onSignUp={() => openAuth('register')}
        session={session}
        isBooting={authConfig.loading}
      />
      <AuthDialog
        key={`landing-${authMode}`}
        open={isAuthOpen}
        mode={authMode}
        authRequired={AUTH_REQUIRED}
        isSubmitting={isSubmittingAuth}
        error={authError}
        onClose={() => setIsAuthOpen(false)}
        onModeChange={setAuthMode}
        onSubmit={handleAuthSubmit}
      />
    </>
  )
}
