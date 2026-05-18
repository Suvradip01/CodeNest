import Desktop from '../components/Desktop'
import AuthDialog from '../components/AuthDialog'
import { useAuth } from '../hooks/useAuth'
import { AUTH_REQUIRED } from '../config/constants'

export default function DesktopView() {
  const {
    isAuthOpen,
    setIsAuthOpen,
    authMode,
    setAuthMode,
    authError,
    isSubmittingAuth,
    handleLaunchEditor,
    handleAuthSubmit,
  } = useAuth()


  return (
    <>
      <Desktop onLaunchEditor={handleLaunchEditor} />
      <AuthDialog
        key={`desktop-${authMode}`}
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
