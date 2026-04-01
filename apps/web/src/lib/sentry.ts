/**
 * Sentry Initialization
 *
 * Initializes Sentry error tracking for the web app. Called early in main.tsx
 * before React mounts. No-ops when VITE_SENTRY_DSN is not configured.
 */
import { browserTracingIntegration, init } from '@sentry/react'

/** Initialize Sentry if a DSN and explicit app environment are configured. */
export function initSentry(): void {
  const dsn = import.meta.env.VITE_SENTRY_DSN
  const appEnv = import.meta.env.VITE_APP_ENV
  if (!dsn || !appEnv || import.meta.env.DEV) return

  init({
    dsn,
    environment: appEnv,
    tracesSampleRate: import.meta.env.PROD ? 0.1 : 1.0,
    tracePropagationTargets: [window.location.origin],
    integrations: [browserTracingIntegration()],
  })
}
