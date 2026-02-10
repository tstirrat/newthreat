/**
 * Query hook for a fight metadata payload.
 */
import { useQuery } from '@tanstack/react-query'

import { fightQueryKey, getFight } from '../api/reports'
import type { FightsResponse } from '../types/api'

/** Fetch and cache fight metadata. */
export function useFightData(
  reportId: string,
  fightId: number,
): {
  data: FightsResponse | undefined
  isLoading: boolean
  error: Error | null
} {
  const query = useQuery({
    queryKey: fightQueryKey(reportId, fightId),
    queryFn: () => getFight(reportId, fightId),
    enabled: reportId.length > 0 && Number.isFinite(fightId),
  })

  return {
    data: query.data,
    isLoading: query.isLoading,
    error: query.error,
  }
}
