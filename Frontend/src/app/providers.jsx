import React from 'react'
import { ThemeProvider } from '../components/common/theme-provider'
import { AuthProvider } from '../context/AuthContext'
import { ErrorBoundary } from '../components/common/ErrorBoundary'

// Consolidates all global context providers in a single component layer.
export function AppProviders({ children }) {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <AuthProvider>
        <ErrorBoundary>
          {children}
        </ErrorBoundary>
      </AuthProvider>
    </ThemeProvider>
  )
}
