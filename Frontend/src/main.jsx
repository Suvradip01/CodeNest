import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { ThemeProvider } from './components/theme-provider.jsx'

// Check environment and inject 'global' polyfill for external libraries (like PrismJS).
if (typeof window !== 'undefined') { window.global = window }

// Initialize DOM concurrent roots and mount the global theme and routing trees.
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <App />
    </ThemeProvider>
  </StrictMode>,
)
