import LandingPage from '../components/LandingPage'
import AuthDialog from '../components/AuthDialog'
import { useAuth } from '../hooks/useAuth'
import { AUTH_REQUIRED } from '../config/constants'

export default function Landing() {
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
