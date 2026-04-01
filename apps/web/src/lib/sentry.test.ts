/**
 * Tests for Sentry initialization module.
 */
import { browserTracingIntegration, init } from '@sentry/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { initSentry } from './sentry'

vi.mock('@sentry/react', () => ({
  init: vi.fn(),
  browserTracingIntegration: vi.fn(() => ({ name: 'BrowserTracing' })),
}))

describe('initSentry', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('sets environment from VITE_APP_ENV', () => {
    vi.stubEnv('VITE_SENTRY_DSN', 'https://public@o0.ingest.sentry.io/0')
    vi.stubEnv('VITE_APP_ENV', 'staging')

    initSentry()

    expect(init).toHaveBeenCalledWith(
      expect.objectContaining({
        environment: 'staging',
      }),
    )
  })

  it('calls init when VITE_SENTRY_DSN and VITE_APP_ENV are set', () => {
    vi.stubEnv('VITE_SENTRY_DSN', 'https://public@o0.ingest.sentry.io/0')
    vi.stubEnv('VITE_APP_ENV', 'production')

    initSentry()

    expect(init).toHaveBeenCalledOnce()
    expect(init).toHaveBeenCalledWith(
      expect.objectContaining({
        dsn: 'https://public@o0.ingest.sentry.io/0',
        tracePropagationTargets: [window.location.origin],
      }),
    )
    expect(browserTracingIntegration).toHaveBeenCalledOnce()
  })

  it('does not call init when VITE_APP_ENV is not set', () => {
    vi.stubEnv('VITE_SENTRY_DSN', 'https://public@o0.ingest.sentry.io/0')
    vi.stubEnv('VITE_APP_ENV', undefined)

    initSentry()

    expect(init).not.toHaveBeenCalled()
  })

  it('does not call init when VITE_SENTRY_DSN is empty', () => {
    vi.stubEnv('VITE_SENTRY_DSN', '')
    vi.stubEnv('VITE_APP_ENV', 'production')

    initSentry()

    expect(init).not.toHaveBeenCalled()
  })

  it('does not call init when VITE_SENTRY_DSN is undefined', () => {
    vi.stubEnv('VITE_SENTRY_DSN', undefined)
    vi.stubEnv('VITE_APP_ENV', 'production')

    initSentry()

    expect(init).not.toHaveBeenCalled()
  })
})
