/**
 * Tests for the shared app environment detection utility.
 */
import { afterEach, describe, expect, it, vi } from 'vitest'

import { getEnvironment } from './environment'

describe('getEnvironment', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('returns development for localhost', () => {
    vi.stubGlobal('location', { hostname: 'localhost' })

    expect(getEnvironment()).toBe('development')
  })

  it('returns development for 127.0.0.1', () => {
    vi.stubGlobal('location', { hostname: '127.0.0.1' })

    expect(getEnvironment()).toBe('development')
  })

  it('returns development for [::1]', () => {
    vi.stubGlobal('location', { hostname: '[::1]' })

    expect(getEnvironment()).toBe('development')
  })

  it('returns staging for PR preview channels', () => {
    vi.stubGlobal('location', { hostname: 'wow-threat--pr-42.web.app' })

    expect(getEnvironment()).toBe('staging')
  })

  it('returns production for the primary firebase app hostname', () => {
    vi.stubGlobal('location', { hostname: 'wow-threat.web.app' })

    expect(getEnvironment()).toBe('production')
  })

  it('returns production for the firebaseapp.com hostname', () => {
    vi.stubGlobal('location', { hostname: 'wow-threat.firebaseapp.com' })

    expect(getEnvironment()).toBe('production')
  })
})
