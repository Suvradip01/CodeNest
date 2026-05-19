import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Landing from '../pages/Landing'
import DesktopView from '../pages/DesktopView'
import DashboardView from '../pages/DashboardView'
import ProtectedRoute from '../features/auth/components/ProtectedRoute'

// Defines app-wide client routing tables and session guard boundaries.
export function AppRouter() {
  return (
    <Routes>
      {/* Unprotected Landing */}
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
  )
}
