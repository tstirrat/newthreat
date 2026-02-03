/**
 * Tests for Cache Service
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createMemoryCache, CacheKeys } from './cache'

describe('createMemoryCache', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('stores and retrieves values', async () => {
    const cache = createMemoryCache()

    await cache.set('test-key', { foo: 'bar' })
    const result = await cache.get<{ foo: string }>('test-key')

    expect(result).toEqual({ foo: 'bar' })
  })

  it('returns null for missing keys', async () => {
    const cache = createMemoryCache()

    const result = await cache.get('non-existent')

    expect(result).toBeNull()
  })

  it('expires entries after TTL', async () => {
    const cache = createMemoryCache()

    // Set with 60 second TTL
    await cache.set('ttl-key', 'value', 60)

    // Should exist immediately
    expect(await cache.get('ttl-key')).toBe('value')

    // Advance time past TTL
    vi.advanceTimersByTime(61 * 1000)

    // Should be expired
    expect(await cache.get('ttl-key')).toBeNull()
  })

  it('persists entries without TTL indefinitely', async () => {
    const cache = createMemoryCache()

    await cache.set('permanent-key', 'value')

    // Advance time significantly
    vi.advanceTimersByTime(365 * 24 * 60 * 60 * 1000) // 1 year

    // Should still exist
    expect(await cache.get('permanent-key')).toBe('value')
  })

  it('deletes entries correctly', async () => {
    const cache = createMemoryCache()

    await cache.set('delete-key', 'value')
    expect(await cache.get('delete-key')).toBe('value')

    await cache.delete('delete-key')
    expect(await cache.get('delete-key')).toBeNull()
  })

  it('handles delete of non-existent key gracefully', async () => {
    const cache = createMemoryCache()

    // Should not throw
    await expect(cache.delete('non-existent')).resolves.not.toThrow()
  })
})

describe('CacheKeys', () => {
  it('generates correct wcl token key', () => {
    expect(CacheKeys.wclToken()).toBe('wcl:token')
  })

  it('generates correct report key', () => {
    expect(CacheKeys.report('ABC123')).toBe('wcl:report:ABC123')
  })

  it('generates correct fights key', () => {
    expect(CacheKeys.fights('ABC123')).toBe('wcl:fights:ABC123')
  })

  it('generates correct events key', () => {
    expect(CacheKeys.events('ABC123', 5)).toBe('wcl:events:ABC123:5')
  })

  it('generates correct augmented events key', () => {
    expect(CacheKeys.augmentedEvents('ABC123', 5, 'v1.2.0')).toBe(
      'augmented:ABC123:5:v1.2.0'
    )
  })
})
