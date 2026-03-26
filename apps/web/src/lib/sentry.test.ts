/**
 * Tests for Sentry initialization module.
 */
import * as Sentry from '@sentry/react'
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

  it('calls Sentry.init when VITE_SENTRY_DSN is set', () => {
    vi.stubEnv('VITE_SENTRY_DSN', 'https://public@o0.ingest.sentry.io/0')

    initSentry()

    expect(Sentry.init).toHaveBeenCalledOnce()
    expect(Sentry.init).toHaveBeenCalledWith(
      expect.objectContaining({
        dsn: 'https://public@o0.ingest.sentry.io/0',
      }),
    )
  })

  it('does not call Sentry.init when VITE_SENTRY_DSN is empty', () => {
    vi.stubEnv('VITE_SENTRY_DSN', '')

    initSentry()

    expect(Sentry.init).not.toHaveBeenCalled()
  })

  it('does not call Sentry.init when VITE_SENTRY_DSN is undefined', () => {
    vi.stubEnv('VITE_SENTRY_DSN', undefined)

    initSentry()

    expect(Sentry.init).not.toHaveBeenCalled()
  })
})
