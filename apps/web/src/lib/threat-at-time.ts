/**
 * Binary search utilities for resolving cumulative threat at a given timestamp.
 */
import type { PlayerClass } from '@wow-threat/wcl-types'

import type { ThreatPoint, ThreatSeries } from '../types/app'

export interface ThreatAtTimeEntry {
  actorId: number
  actorName: string
  actorClass: PlayerClass | null
  actorType: 'Player' | 'Pet'
  color: string
  threat: number
}

/** Find the last ThreatPoint at or before timeMs using binary search (step-end interpolation). */
export function findLastPointAtOrBefore(
  points: ThreatPoint[],
  timeMs: number,
): ThreatPoint | null {
  if (points.length === 0) {
    return null
  }

  let low = 0
  let high = points.length - 1

  if (points[low]!.timeMs > timeMs) {
    return null
  }

  if (points[high]!.timeMs <= timeMs) {
    return points[high]!
  }

  while (low < high) {
    const mid = low + Math.floor((high - low + 1) / 2)
    if (points[mid]!.timeMs <= timeMs) {
      low = mid
    } else {
      high = mid - 1
    }
  }

  return points[low]!
}

/** Resolve cumulative threat for all actors at a given timestamp. */
export function getThreatAtTime(
  series: ThreatSeries[],
  timeMs: number,
): ThreatAtTimeEntry[] {
  return series.map((s) => {
    const point = findLastPointAtOrBefore(s.points, timeMs)
    return {
      actorId: s.actorId,
      actorName: s.actorName,
      actorClass: s.actorClass,
      actorType: s.actorType,
      color: s.color,
      threat: point?.totalThreat ?? 0,
    }
  })
}
