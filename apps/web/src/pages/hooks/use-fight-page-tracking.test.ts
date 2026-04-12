/**
 * Unit tests for the fight page load-milestone tracking hook.
 */
import { renderHook } from '@testing-library/react'
import type { PostHog } from 'posthog-js'
import { describe, expect, it, vi } from 'vitest'

import { useFightPageTracking } from './use-fight-page-tracking'

function createMockPosthog(): PostHog {
  return { capture: vi.fn() } as unknown as PostHog
}

function createProps(
  overrides: Partial<Parameters<typeof useFightPageTracking>[0]> = {},
): Parameters<typeof useFightPageTracking>[0] {
  return {
    fightId: 1,
    reportId: 'ABC123',
    fightData: null,
    eventsQueryError: null,
    isChartReady: false,
    visibleSeriesCount: 0,
    ...overrides,
  }
}

describe('useFightPageTracking', () => {
  describe('fight_loaded', () => {
    it('captures fight_loaded when fightData becomes available', () => {
      const posthog = createMockPosthog()
      renderHook(() =>
        useFightPageTracking(
          createProps({
            fightData: { name: 'Onyxia' },
            posthog,
          }),
        ),
      )

      expect(posthog.capture).toHaveBeenCalledWith(
        'fight_loaded',
        expect.objectContaining({
          fight_id: 1,
          report_id: 'ABC123',
          boss_name: 'Onyxia',
        }),
      )
    })

    it('does not capture fight_loaded when fightData is null', () => {
      const posthog = createMockPosthog()
      renderHook(() =>
        useFightPageTracking(createProps({ fightData: null, posthog })),
      )

      expect(posthog.capture).not.toHaveBeenCalledWith(
        'fight_loaded',
        expect.anything(),
      )
    })

    it('does not capture fight_loaded when posthog is absent', () => {
      const posthog = createMockPosthog()
      renderHook(() =>
        useFightPageTracking(createProps({ fightData: { name: 'Onyxia' } })),
      )

      expect(posthog.capture).not.toHaveBeenCalled()
    })

    it('captures fight_loaded only once per fightId', () => {
      const posthog = createMockPosthog()
      const props = createProps({ fightData: { name: 'Onyxia' }, posthog })
      const { rerender } = renderHook(() => useFightPageTracking(props))

      rerender()
      rerender()

      const calls = (
        posthog.capture as ReturnType<typeof vi.fn>
      ).mock.calls.filter(([event]) => event === 'fight_loaded')
      expect(calls).toHaveLength(1)
    })
  })

  describe('threat_chart_loaded', () => {
    it('captures threat_chart_loaded when chart is ready with visible series', () => {
      const posthog = createMockPosthog()
      renderHook(() =>
        useFightPageTracking(
          createProps({
            isChartReady: true,
            visibleSeriesCount: 5,
            posthog,
          }),
        ),
      )

      expect(posthog.capture).toHaveBeenCalledWith(
        'threat_chart_loaded',
        expect.objectContaining({
          fight_id: 1,
          report_id: 'ABC123',
          player_count: 5,
        }),
      )
    })

    it('does not capture threat_chart_loaded when chart is not ready', () => {
      const posthog = createMockPosthog()
      renderHook(() =>
        useFightPageTracking(
          createProps({ isChartReady: false, visibleSeriesCount: 5, posthog }),
        ),
      )

      expect(posthog.capture).not.toHaveBeenCalledWith(
        'threat_chart_loaded',
        expect.anything(),
      )
    })

    it('does not capture threat_chart_loaded when visibleSeriesCount is 0', () => {
      const posthog = createMockPosthog()
      renderHook(() =>
        useFightPageTracking(
          createProps({ isChartReady: true, visibleSeriesCount: 0, posthog }),
        ),
      )

      expect(posthog.capture).not.toHaveBeenCalledWith(
        'threat_chart_loaded',
        expect.anything(),
      )
    })

    it('captures threat_chart_loaded only once per fightId', () => {
      const posthog = createMockPosthog()
      const props = createProps({
        isChartReady: true,
        visibleSeriesCount: 3,
        posthog,
      })
      const { rerender } = renderHook(() => useFightPageTracking(props))

      rerender()
      rerender()

      const calls = (
        posthog.capture as ReturnType<typeof vi.fn>
      ).mock.calls.filter(([event]) => event === 'threat_chart_loaded')
      expect(calls).toHaveLength(1)
    })
  })

  describe('threat_chart_failed', () => {
    it('captures threat_chart_failed when eventsQueryError is set', () => {
      const posthog = createMockPosthog()
      const error = new Error('fetch failed')
      renderHook(() =>
        useFightPageTracking(createProps({ eventsQueryError: error, posthog })),
      )

      expect(posthog.capture).toHaveBeenCalledWith(
        'threat_chart_failed',
        expect.objectContaining({
          fight_id: 1,
          report_id: 'ABC123',
          error_message: 'fetch failed',
        }),
      )
    })

    it('does not capture threat_chart_failed when eventsQueryError is null', () => {
      const posthog = createMockPosthog()
      renderHook(() =>
        useFightPageTracking(createProps({ eventsQueryError: null, posthog })),
      )

      expect(posthog.capture).not.toHaveBeenCalledWith(
        'threat_chart_failed',
        expect.anything(),
      )
    })

    it('captures threat_chart_failed only once per fightId', () => {
      const posthog = createMockPosthog()
      const error = new Error('fetch failed')
      const props = createProps({ eventsQueryError: error, posthog })
      const { rerender } = renderHook(() => useFightPageTracking(props))

      rerender()
      rerender()

      const calls = (
        posthog.capture as ReturnType<typeof vi.fn>
      ).mock.calls.filter(([event]) => event === 'threat_chart_failed')
      expect(calls).toHaveLength(1)
    })
  })
})
