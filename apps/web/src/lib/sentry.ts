/**
 * Sentry Initialization
 *
 * Initializes Sentry error tracking for the web app. Called early in main.tsx
 * before React mounts. No-ops when VITE_SENTRY_DSN is not configured.
 */
import * as Sentry from '@sentry/react'

/** Initialize Sentry if a DSN is configured. */
export function initSentry(): void {
  const dsn = import.meta.env.VITE_SENTRY_DSN as string | undefined
  if (!dsn) return

  Sentry.init({
    dsn,
    environment: import.meta.env.MODE,
    tracesSampleRate: import.meta.env.PROD ? 0.1 : 1.0,
    integrations: [Sentry.browserTracingIntegration()],
  })
}
