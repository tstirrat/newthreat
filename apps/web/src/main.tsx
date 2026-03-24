/**
 * Client entrypoint for mounting the React application.
 */
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import { App } from './app'
import './index.css'
import { initMonitoring } from './lib/monitoring'
import { initializeTheme } from './lib/theme'

// Sentry initialized before rendering so the first render is captured.
// PostHog is initialized via PostHogAnalyticsProvider inside App.
initMonitoring()

initializeTheme()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
