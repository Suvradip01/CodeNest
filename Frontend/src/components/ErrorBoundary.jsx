import React from 'react'

// Error sentinel component that isolates runtime visual crashes to prevent total page failures.
export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    // Tracks current crash state and the captured exception details.
    this.state = { hasError: false, error: null }
  }

  // Intercepts the rendering exception and triggers a local state fallback render phase.
  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  // Sends the captured stack trace to console telemetry for easy debugging.
  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
  }

  render() {
    // Render a premium fallback container with a self-healing state reset if a crash is active.
    if (this.state.hasError) {
      return (
        <div className="min-h-[200px] p-6 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 rounded-lg flex flex-col gap-3 my-4 justify-center items-center text-center animate-pulse">
          <h2 className="text-red-800 dark:text-red-200 font-semibold text-lg flex items-center gap-2">
            ⚠️ Panel Render Crash
          </h2>
          <p className="text-sm text-red-600 dark:text-red-400 max-w-md">
            {this.state.error?.message || 'An unexpected rendering error occurred in this workspace section.'}
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded text-sm w-fit transition-colors font-medium shadow-sm cursor-pointer"
          >
            Reset Panel State
          </button>
        </div>
      )
    }

    // Default flow: render children components normally if no exceptions were thrown.
    return this.props.children
  }
}
