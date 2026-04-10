/**
 * Unit tests for threat-at-time binary search utility.
 */
import { describe, expect, it } from 'vitest'

import type { ThreatPoint, ThreatSeries } from '../types/app'
import { findLastPointAtOrBefore, getThreatAtTime } from './threat-at-time'

function makePoint(timeMs: number, totalThreat: number): ThreatPoint {
  return {
    timestamp: timeMs,
    timeMs,
    totalThreat,
    threatDelta: 0,
    amount: 0,
    baseThreat: 0,
    modifiedThreat: 0,
    eventType: 'damage',
    abilityName: 'Test',
    spellSchool: null,
    modifiers: [],
  }
}

function makeSeries(
  overrides: Partial<ThreatSeries> & { points: ThreatPoint[] },
): ThreatSeries {
  return {
    actorId: 1,
    actorName: 'Player',
    actorClass: 'Warrior',
    actorType: 'Player',
    actorRole: undefined,
    ownerId: null,
    label: 'Player',
    color: '#C79C6E',
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

describe('findLastPointAtOrBefore', () => {
  it('returns null for empty points', () => {
    expect(findLastPointAtOrBefore([], 1000)).toBeNull()
  })

  it('returns null when timeMs is before the first point', () => {
    const points = [makePoint(500, 100)]
    expect(findLastPointAtOrBefore(points, 200)).toBeNull()
  })

  it('returns exact match', () => {
    const points = [
      makePoint(100, 50),
      makePoint(200, 100),
      makePoint(300, 150),
    ]
    expect(findLastPointAtOrBefore(points, 200)?.totalThreat).toBe(100)
  })

  it('returns the last point at or before timeMs (step-end)', () => {
    const points = [
      makePoint(100, 50),
      makePoint(300, 150),
      makePoint(500, 250),
    ]
    expect(findLastPointAtOrBefore(points, 200)?.totalThreat).toBe(50)
    expect(findLastPointAtOrBefore(points, 400)?.totalThreat).toBe(150)
  })

  it('returns last point when timeMs is after all points', () => {
    const points = [makePoint(100, 50), makePoint(200, 100)]
    expect(findLastPointAtOrBefore(points, 9999)?.totalThreat).toBe(100)
  })

  it('returns first point when timeMs matches first point exactly', () => {
    const points = [makePoint(0, 10), makePoint(100, 20)]
    expect(findLastPointAtOrBefore(points, 0)?.totalThreat).toBe(10)
  })

  it('handles single-element array', () => {
    const points = [makePoint(100, 50)]
    expect(findLastPointAtOrBefore(points, 100)?.totalThreat).toBe(50)
    expect(findLastPointAtOrBefore(points, 200)?.totalThreat).toBe(50)
    expect(findLastPointAtOrBefore(points, 50)).toBeNull()
  })
})

describe('getThreatAtTime', () => {
  it('returns threat for multiple series at a given time', () => {
    const series = [
      makeSeries({
        actorId: 1,
        actorName: 'Warrior',
        points: [makePoint(0, 0), makePoint(100, 500), makePoint(200, 1000)],
      }),
      makeSeries({
        actorId: 2,
        actorName: 'Rogue',
        actorClass: 'Rogue',
        color: '#FFF569',
        points: [makePoint(50, 0), makePoint(150, 300)],
      }),
    ]

    const result = getThreatAtTime(series, 150)
    expect(result).toEqual([
      expect.objectContaining({
        actorId: 1,
        actorName: 'Warrior',
        threat: 500,
      }),
      expect.objectContaining({ actorId: 2, actorName: 'Rogue', threat: 300 }),
    ])
  })

  it('returns zero threat for series with no points before timeMs', () => {
    const series = [
      makeSeries({
        actorId: 1,
        points: [makePoint(500, 100)],
      }),
    ]

    const result = getThreatAtTime(series, 100)
    expect(result[0]?.threat).toBe(0)
  })

  it('returns zero threat for series with empty points', () => {
    const series = [makeSeries({ actorId: 1, points: [] })]

    const result = getThreatAtTime(series, 100)
    expect(result[0]?.threat).toBe(0)
  })
})
