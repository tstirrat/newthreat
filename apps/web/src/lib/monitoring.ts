/**
 * Error monitoring module (web).
 *
 * Initializes Sentry for React. No-ops when VITE_SENTRY_DSN is absent.
 *
 * Usage:
 *   import { initMonitoring } from '@/lib/monitoring'
 *   initMonitoring()   // call once before rendering
 *
 * The Sentry error boundary is exported separately for use in app.tsx:
 *   import { SentryErrorBoundary } from '@/lib/monitoring'
 */
import * as Sentry from '@sentry/react'

export { ErrorBoundary as SentryErrorBoundary } from '@sentry/react'

export function initMonitoring(): void {
  const dsn = import.meta.env.VITE_SENTRY_DSN as string | undefined
  if (!dsn) return

  Sentry.init({
    dsn,
    environment: import.meta.env.MODE,
    // Capture 100% of errors, 5% of performance traces.
    tracesSampleRate: 0.05,
    // Only report errors from our own origin, not browser extensions etc.
    allowUrls: [window.location.origin],
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({
        // Mask all text + block media for privacy. Captures only session structure.
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],
    // Capture 1% of sessions for replay, 100% on errors.
    replaysSessionSampleRate: 0.01,
    replaysOnErrorSampleRate: 1.0,
  })
}

/**
 * Tag the current Sentry scope with the authenticated user id.
 * Call this after a successful sign-in.
 */
export function setMonitoringUser(uid: string): void {
  Sentry.setUser({ id: uid })
}

/**
 * Clear the Sentry user scope on sign-out.
 */
export function clearMonitoringUser(): void {
  Sentry.setUser(null)
}
