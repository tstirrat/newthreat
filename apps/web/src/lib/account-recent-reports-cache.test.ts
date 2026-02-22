/**
 * Unit tests for local-storage account recent reports cache helpers.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { RecentReportSummary } from '../types/api'
import {
  loadAccountRecentReportsCache,
  saveAccountRecentReportsCache,
} from './account-recent-reports-cache'
import {
  accountRecentReportsCacheTtlMs,
  accountRecentReportsStorageKey,
} from './constants'

const sampleReports: RecentReportSummary[] = [
  {
    code: 'ABC123',
    title: 'Personal Log',
    startTime: 1700000000000,
    endTime: 1700000005000,
    zoneName: 'Naxxramas',
    guildName: 'Threat Guild',
    guildFaction: 'Alliance',
    source: 'personal',
  },
]

describe('account-recent-reports-cache', () => {
  let originalLocalStorage: Storage

  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-02-22T18:00:00.000Z'))

    originalLocalStorage = window.localStorage
    const values = new Map<string, string>()
    const mockLocalStorage = {
      clear: (): void => {
        values.clear()
      },
      getItem: (key: string): string | null => values.get(key) ?? null,
      key: (index: number): string | null =>
        Array.from(values.keys())[index] ?? null,
      get length(): number {
        return values.size
      },
      removeItem: (key: string): void => {
        values.delete(key)
      },
      setItem: (key: string, value: string): void => {
        values.set(key, value)
      },
    } satisfies Storage

    Object.defineProperty(window, 'localStorage', {
      configurable: true,
      value: mockLocalStorage,
    })
  })

  afterEach(() => {
    vi.useRealTimers()
    Object.defineProperty(window, 'localStorage', {
      configurable: true,
      value: originalLocalStorage,
    })
  })

  it('loads cache for matching uid within ttl', () => {
    const fetchedAtMs = Date.now()
    saveAccountRecentReportsCache('wcl:12345', sampleReports, fetchedAtMs)

    expect(loadAccountRecentReportsCache('wcl:12345')).toEqual({
      fetchedAtMs,
      reports: sampleReports,
    })
  })

  it('returns null for non-matching uid', () => {
    saveAccountRecentReportsCache('wcl:12345', sampleReports, Date.now())

    expect(loadAccountRecentReportsCache('wcl:99999')).toBeNull()
  })

  it('returns null when cache is older than ttl', () => {
    const fetchedAtMs = Date.now()
    saveAccountRecentReportsCache('wcl:12345', sampleReports, fetchedAtMs)
    vi.advanceTimersByTime(accountRecentReportsCacheTtlMs + 1)

    expect(loadAccountRecentReportsCache('wcl:12345')).toBeNull()
  })

  it('returns null for malformed cache payload', () => {
    window.localStorage.setItem(accountRecentReportsStorageKey, 'not-json')

    expect(loadAccountRecentReportsCache('wcl:12345')).toBeNull()
  })
})
