/**
 * Query hook for report-level player rankings across fights.
 */
import { useMemo } from 'react'
import { useQueries } from '@tanstack/react-query'

import { fightEventsQueryKey, getFightEvents } from '../api/reports'
import { buildReportRankings, type ReportPlayerRanking } from '../lib/threat-aggregation'
import type { ReportActorSummary, ReportFightSummary } from '../types/api'

export interface UseReportRankingsResult {
  rankings: ReportPlayerRanking[]
  isLoading: boolean
  error: Error | null
}

/** Fetch fight event payloads and aggregate report-level rankings. */
export function useReportRankings({
  reportId,
  fights,
  actors,
}: {
  reportId: string
  fights: ReportFightSummary[]
  actors: ReportActorSummary[]
}): UseReportRankingsResult {
  const queries = useQueries({
    queries: fights.map((fight) => ({
      queryKey: fightEventsQueryKey(reportId, fight.id),
      queryFn: () => getFightEvents(reportId, fight.id),
      enabled: reportId.length > 0,
    })),
  })

  const error = queries.find((query) => query.error)?.error ?? null
  const isLoading = queries.some((query) => query.isLoading)

  const rankings = useMemo(() => {
    if (queries.some((query) => !query.data)) {
      return []
    }

    return buildReportRankings({
      fights: queries.map((query, index) => ({
        fightId: fights[index]?.id ?? -1,
        events: query.data?.events ?? [],
      })),
      actors,
    })
  }, [actors, fights, queries])

  return {
    rankings,
    isLoading,
    error,
  }
}
