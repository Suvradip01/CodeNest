import { Navigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

// Gated route wrapper: enforces session-based JWT authentication for private pages.
export default function ProtectedRoute({ children }) {
  const { session, authConfig } = useAuth()

  // Display a dark-mode spinner while verifying active credentials from localStorage on boot.
  if (authConfig.loading) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-zinc-950 text-zinc-400 gap-4">
        <div className="h-10 w-10 border-4 border-zinc-700 border-t-zinc-200 rounded-full animate-spin"></div>
        <span className="text-sm font-medium tracking-wide">Restoring Session...</span>
      </div>
    )
  }

  // Redirect guest traffic back to the landing page if no session token is active.
  if (!session?.token) {
    return <Navigate to="/" replace />
  }

  // Render the protected views normally if the validation passes.
  return children
}
