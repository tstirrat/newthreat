/**
 * Query hook for a fight's augmented event timeline.
 */
import { useQuery } from '@tanstack/react-query'

import { fightEventsQueryKey, getFightEvents } from '../api/reports'
import type { AugmentedEventsResponse } from '../types/api'

/** Fetch and cache fight events. */
export function useFightEvents(
  reportId: string,
  fightId: number,
  configVersion: string | null,
): {
  data: AugmentedEventsResponse | undefined
  isLoading: boolean
  error: Error | null
} {
  const query = useQuery({
    queryKey: fightEventsQueryKey(reportId, fightId, configVersion),
    queryFn: () => getFightEvents(reportId, fightId, configVersion),
    enabled: reportId.length > 0 && Number.isFinite(fightId),
  })

  return {
    data: query.data,
    isLoading: query.isLoading,
    error: query.error,
  }
}
