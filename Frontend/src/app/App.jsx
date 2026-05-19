import React from 'react'
import { BrowserRouter as Router } from 'react-router-dom'
import { AppProviders } from './providers'
import { AppRouter } from './router'

// Root entry component establishing global state providers and navigation routers.
export default function App() {

  return (
    <Router>
      <AppProviders>
        <AppRouter />
      </AppProviders>
    </Router>
  )
}
