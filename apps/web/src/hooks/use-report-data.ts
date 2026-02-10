/**
 * Query hook for report metadata.
 */
import { useQuery } from '@tanstack/react-query'

import { getReport, reportQueryKey } from '../api/reports'
import type { ReportResponse } from '../types/api'

/** Fetch and cache report metadata. */
export function useReportData(reportId: string): {
  data: ReportResponse | undefined
  isLoading: boolean
  error: Error | null
} {
  const query = useQuery({
    queryKey: reportQueryKey(reportId),
    queryFn: () => getReport(reportId),
    enabled: reportId.length > 0,
  })

  return {
    data: query.data,
    isLoading: query.isLoading,
    error: query.error,
  }
}
