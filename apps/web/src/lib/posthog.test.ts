/**
 * Tests for PostHog configuration module.
 */
import type { PostHog } from 'posthog-js'
import { afterEach, describe, expect, it, vi } from 'vitest'

describe('isPostHogEnabled', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.resetModules()
  })

  it('returns false when VITE_POSTHOG_KEY is not set', async () => {
    vi.stubEnv('VITE_POSTHOG_KEY', '')
    vi.resetModules()

    const { isPostHogEnabled } = await import('./posthog')

    expect(isPostHogEnabled()).toBe(false)
  })

  it('returns false when VITE_POSTHOG_KEY is undefined', async () => {
    vi.stubEnv('VITE_POSTHOG_KEY', undefined)
    vi.resetModules()

    const { isPostHogEnabled } = await import('./posthog')

    expect(isPostHogEnabled()).toBe(false)
  })

  it('returns true when VITE_POSTHOG_KEY is set to a non-empty value', async () => {
    vi.stubEnv('VITE_POSTHOG_KEY', 'phc_test_key')
    vi.resetModules()

    const { isPostHogEnabled } = await import('./posthog')

    expect(isPostHogEnabled()).toBe(true)
  })
})

describe('posthogOptions', () => {
  it('disables automatic pageview capture', async () => {
    const { posthogOptions } = await import('./posthog')

    expect(posthogOptions.capture_pageview).toBe(false)
  })

  it('disables autocapture', async () => {
    const { posthogOptions } = await import('./posthog')

    expect(posthogOptions.autocapture).toBe(false)
  })

  it('disables session recording', async () => {
    const { posthogOptions } = await import('./posthog')

    expect(posthogOptions.disable_session_recording).toBe(true)
  })

  it('restricts person profiles to identified-only to avoid anonymous profile creation', async () => {
    const { posthogOptions } = await import('./posthog')

    expect(posthogOptions.person_profiles).toBe('identified_only')
  })

  it('loaded callback registers environment as a super property for production hostname', async () => {
    vi.stubGlobal('location', { hostname: 'wow-threat.web.app' })
    vi.resetModules()

    const { posthogOptions } = await import('./posthog')
    const mockPostHog = { register: vi.fn() } as unknown as PostHog

    posthogOptions.loaded?.(mockPostHog)

    expect(mockPostHog.register).toHaveBeenCalledWith({
      environment: 'production',
    })
  })

  it('loaded callback registers environment as development for localhost', async () => {
    vi.stubGlobal('location', { hostname: 'localhost' })
    vi.resetModules()

    const { posthogOptions } = await import('./posthog')
    const mockPostHog = { register: vi.fn() } as unknown as PostHog

    posthogOptions.loaded?.(mockPostHog)

    expect(mockPostHog.register).toHaveBeenCalledWith({
      environment: 'development',
    })
  })
})
