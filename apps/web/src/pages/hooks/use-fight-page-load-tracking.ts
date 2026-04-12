/**
 * PostHog tracking for fight page load milestones.
 *
 * Fires fight_loaded, threat_chart_loaded, and threat_chart_failed automatically
 * via effects. Each event includes a load_time_ms measured from component mount.
 */
import type { PostHog } from 'posthog-js'
import { useEffect, useRef } from 'react'

export interface UseFightPageLoadTrackingParams {
  fightId: number
  reportId: string
  fightData: { name: string } | null
  eventsQueryError: Error | null
  isChartReady: boolean
  visibleSeriesCount: number
  posthog?: PostHog
}

/** Track fight page load milestones via PostHog. */
export function useFightPageLoadTracking({
  fightId,
  reportId,
  fightData,
  eventsQueryError,
  isChartReady,
  visibleSeriesCount,
  posthog,
}: UseFightPageLoadTrackingParams): void {
  const mountTimeRef = useRef<number | null>(null)
  const trackedFightLoadedRef = useRef<number | null>(null)
  const trackedChartLoadedRef = useRef<number | null>(null)
  const trackedChartFailedRef = useRef<number | null>(null)

  useEffect(() => {
    mountTimeRef.current ??= performance.now()
  }, [])

  useEffect(() => {
    if (!fightData || !posthog) return
    if (trackedFightLoadedRef.current === fightId) return
    trackedFightLoadedRef.current = fightId
    posthog.capture('fight_loaded', {
      report_id: reportId,
      fight_id: fightId,
      boss_name: fightData.name,
      load_time_ms:
        mountTimeRef.current !== null
          ? Math.round(performance.now() - mountTimeRef.current)
          : undefined,
    })
  }, [fightData, fightId, posthog, reportId])

  useEffect(() => {
    if (!isChartReady || visibleSeriesCount === 0 || !posthog) return
    if (trackedChartLoadedRef.current === fightId) return
    trackedChartLoadedRef.current = fightId
    posthog.capture('threat_chart_loaded', {
      report_id: reportId,
      fight_id: fightId,
      player_count: visibleSeriesCount,
      load_time_ms:
        mountTimeRef.current !== null
          ? Math.round(performance.now() - mountTimeRef.current)
          : undefined,
    })
  }, [isChartReady, fightId, posthog, reportId, visibleSeriesCount])

  useEffect(() => {
    if (!eventsQueryError || !posthog) return
    if (trackedChartFailedRef.current === fightId) return
    trackedChartFailedRef.current = fightId
    posthog.capture('threat_chart_failed', {
      report_id: reportId,
      fight_id: fightId,
      error_message: eventsQueryError.message,
      load_time_ms:
        mountTimeRef.current !== null
          ? Math.round(performance.now() - mountTimeRef.current)
          : undefined,
    })
  }, [eventsQueryError, fightId, posthog, reportId])
}
