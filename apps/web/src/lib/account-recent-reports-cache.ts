/**
 * Local-storage cache helpers for authenticated account recent reports.
 */
import type { RecentReportSummary } from '../types/api'
import {
  accountRecentReportsCacheTtlMs,
  accountRecentReportsStorageKey,
} from './constants'

interface CachedAccountRecentReports {
  fetchedAtMs: number
  reports: RecentReportSummary[]
  uid: string
}

export interface AccountRecentReportsCacheEntry {
  fetchedAtMs: number
  reports: RecentReportSummary[]
}

function parseCacheEntry(raw: string): CachedAccountRecentReports | null {
  try {
    const parsed = JSON.parse(raw) as CachedAccountRecentReports
    if (
      !parsed ||
      typeof parsed !== 'object' ||
      typeof parsed.uid !== 'string' ||
      !Array.isArray(parsed.reports) ||
      typeof parsed.fetchedAtMs !== 'number'
    ) {
      return null
    }

    return parsed
  } catch {
    return null
  }
}

/** Load cached recent reports for a specific authenticated uid. */
export function loadAccountRecentReportsCache(
  uid: string,
): AccountRecentReportsCacheEntry | null {
  if (typeof window === 'undefined') {
    return null
  }

  const raw = window.localStorage.getItem(accountRecentReportsStorageKey)
  if (!raw) {
    return null
  }

  const parsed = parseCacheEntry(raw)
  if (!parsed || parsed.uid !== uid) {
    return null
  }

  const ageMs = Date.now() - parsed.fetchedAtMs
  if (ageMs > accountRecentReportsCacheTtlMs) {
    return null
  }

  return {
    fetchedAtMs: parsed.fetchedAtMs,
    reports: parsed.reports,
  }
}

/** Save account recent reports cache for a specific authenticated uid. */
export function saveAccountRecentReportsCache(
  uid: string,
  reports: RecentReportSummary[],
  fetchedAtMs: number,
): void {
  if (typeof window === 'undefined') {
    return
  }

  const entry: CachedAccountRecentReports = {
    uid,
    reports,
    fetchedAtMs,
  }
  window.localStorage.setItem(
    accountRecentReportsStorageKey,
    JSON.stringify(entry),
  )
}
