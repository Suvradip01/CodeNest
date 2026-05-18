import React, { useState, useEffect } from 'react'
import Desktop from '../components/Desktop'
import AuthDialog from '../components/AuthDialog'
import { useAuth } from '../hooks/useAuth'
import { AUTH_REQUIRED } from '../config/constants'

// Screen page component rendering the macOS desktop container and active background launcher.
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
    handleLogout,
  } = useAuth()

  // Track if we just closed VSCode to trigger the zoom down animation
  const [isClosingVSCode, setIsClosingVSCode] = useState(
    () => sessionStorage.getItem('codenest_closing') === 'true'
  )

  // Trigger a cinematic 2-second boot sequence on first mount
  // skip it ONLY if we are returning from the IDE dashboard so it doesn't interrupt the transition!
  const [hasBooted, setHasBooted] = useState(
    () => sessionStorage.getItem('codenest_closing') === 'true'
  )

  useEffect(() => {
    if (isClosingVSCode) {
      sessionStorage.removeItem('codenest_closing')
      const timer = setTimeout(() => {
        setIsClosingVSCode(false)
      }, 300) // 300ms match with zoom close keyframes duration
      return () => clearTimeout(timer)
    }
  }, [isClosingVSCode])

  useEffect(() => {
    if (!hasBooted) {
      const timer = setTimeout(() => {
        setHasBooted(true)
      }, 2000)
      return () => clearTimeout(timer)
    }
  }, [hasBooted])

  if (!hasBooted) {
    return (
      <div className="fixed inset-0 bg-[#000000] flex flex-col items-center justify-center z-[9999] selection:bg-transparent">
        <style>{`
          @keyframes boot-progress {
            0% { width: 0%; }
            40% { width: 60%; }
            100% { width: 100%; }
          }
          .animate-boot-progress {
            animation: boot-progress 1.8s cubic-bezier(0.5, 1, 0.89, 1) forwards;
          }
        `}</style>
        {/* Exact Apple Logo SVG File */}
        <img 
          src="/icons/applelogo.svg" 
          alt="Apple" 
          className="w-[84px] h-[84px] mb-[60px] select-none" 
        />
        {/* Apple-style thin grey progress track */}
        <div className="w-[220px] h-[4.5px] bg-[#333333] rounded-full overflow-hidden">
          <div className="h-full bg-[#ffffff] rounded-full animate-boot-progress" />
        </div>
      </div>
    )
  }

  return (
    <div className="animate-in fade-in duration-1000 ease-out">
      {/* ── App Zoom Close Overlay ── */}
      {isClosingVSCode && (
        <div className="fixed bg-[#09090b] border border-white/5 z-[999] shadow-[0_0_50px_rgba(0,0,0,0.8)] animate-app-zoom-close" />
      )}
      <Desktop onLaunchEditor={handleLaunchEditor} onPowerOff={handleLogout} />
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
    </div>
  )
}
