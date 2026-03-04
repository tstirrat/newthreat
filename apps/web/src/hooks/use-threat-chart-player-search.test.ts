/**
 * Unit tests for threat-chart player search state and selection behavior.
 */
import { act, renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import type { ThreatSeries } from '../types/app'
import { useThreatChartPlayerSearch } from './use-threat-chart-player-search'

function createSeries(
  overrides: Partial<ThreatSeries> &
    Pick<ThreatSeries, 'actorId' | 'actorType' | 'label'>,
): ThreatSeries {
  return {
    actorId: overrides.actorId,
    actorName: overrides.label,
    actorClass: null,
    actorType: overrides.actorType,
    ownerId: null,
    label: overrides.label,
    color: '#c79c6e',
    points: [],
    maxThreat: 0,
    totalThreat: 0,
    totalDamage: 0,
    totalHealing: 0,
    stateVisualSegments: [],
    fixateWindows: [],
    invulnerabilityWindows: [],
    ...overrides,
  }
}

describe('useThreatChartPlayerSearch', () => {
  it('isolates the latest focused actor resolved by callback', () => {
    const onFocusAndAddPlayer = vi.fn()
    const onFocusAndIsolatePlayer = vi.fn()
    const clearIsolate = vi.fn()
    let resolvedFocusedActorId: number | null = null
    const series = [
      createSeries({
        actorId: 1,
        actorType: 'Player',
        label: 'Aegistank',
      }),
      createSeries({
        actorId: 2,
        actorType: 'Player',
        label: 'Bladefury',
      }),
    ]

    const { result } = renderHook(() =>
      useThreatChartPlayerSearch({
        clearIsolate,
        focusedActorId: null,
        onFocusAndAddPlayer,
        onFocusAndIsolatePlayer,
        resolveFocusedActorId: () => resolvedFocusedActorId,
        series,
      }),
    )

    resolvedFocusedActorId = 2

    act(() => {
      result.current.isolateFocusedPlayer()
    })

    expect(onFocusAndIsolatePlayer).toHaveBeenCalledWith(2)
    expect(onFocusAndAddPlayer).not.toHaveBeenCalled()
    expect(clearIsolate).toHaveBeenCalledTimes(1)
  })
})
