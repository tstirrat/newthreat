/**
 * Resolve best-known WCL host for a report based on recent history.
 */
import { useMemo } from 'react'

import { defaultHost } from '../lib/constants'
import type { RecentReportEntry, WarcraftLogsHost } from '../types/app'

/** Resolve report host from recents with a safe fallback. */
export function useReportHost(
  reportId: string,
  recentReports: RecentReportEntry[],
): WarcraftLogsHost {
  return useMemo(() => {
    const matched = recentReports.find((entry) => entry.reportId === reportId)
    return matched?.sourceHost ?? defaultHost
  }, [recentReports, reportId])
}
