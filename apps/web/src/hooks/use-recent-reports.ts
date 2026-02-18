/**
 * React hook for recent report local-storage state.
 */
import { useState } from 'react'

import {
  loadRecentReports,
  removeRecentReport,
  upsertRecentReport,
} from '../lib/recent-reports'
import type { RecentReportEntry } from '../types/app'

export interface UseRecentReportsResult {
  recentReports: RecentReportEntry[]
  addRecentReport: (entry: RecentReportEntry) => void
  removeRecentReport: (reportId: string) => void
}

/** Manage recent reports with local-storage persistence. */
export function useRecentReports(): UseRecentReportsResult {
  const [recentReports, setRecentReports] = useState<RecentReportEntry[]>(() =>
    loadRecentReports(),
  )

  const addRecentReport = (entry: RecentReportEntry): void => {
    setRecentReports(upsertRecentReport(entry))
  }

  const handleRemoveRecentReport = (reportId: string): void => {
    setRecentReports(removeRecentReport(reportId))
  }

  return {
    recentReports,
    addRecentReport,
    removeRecentReport: handleRemoveRecentReport,
  }
}
