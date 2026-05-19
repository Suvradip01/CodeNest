import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './app/App.jsx'

// Check environment and inject 'global' polyfill for external libraries (like PrismJS).
if (typeof window !== 'undefined') { window.global = window }

// Initialize DOM concurrent roots.
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
