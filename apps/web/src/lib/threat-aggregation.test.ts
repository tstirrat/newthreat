/**
 * Unit tests for threat aggregation helpers.
 */
import { describe, expect, it } from 'vitest'

import {
  filterSeriesByPlayers,
  selectDefaultTargetId,
} from './threat-aggregation'
import type { ThreatSeries } from '../types/app'

describe('threat-aggregation', () => {
  it('selects target with highest accumulated threat', () => {
    const events = [
      {
        threat: {
          changes: [
            {
              sourceId: 1,
              targetId: 10,
              targetInstance: 0,
              operator: 'add',
              amount: 100,
              total: 100,
            },
          ],
        },
      },
      {
        threat: {
          changes: [
            {
              sourceId: 1,
              targetId: 20,
              targetInstance: 0,
              operator: 'add',
              amount: 200,
              total: 200,
            },
          ],
        },
      },
    ] as Array<{
      threat: {
        changes: Array<{
          sourceId: number
          targetId: number
          targetInstance: number
          operator: 'add' | 'set'
          amount: number
          total: number
        }>
      }
    }>

    expect(selectDefaultTargetId(events as never, new Set([10, 20]))).toBe(20)
  })

  it('filters pet lines by owner when player filter is applied', () => {
    const series: ThreatSeries[] = [
      {
        actorId: 1,
        actorName: 'Warrior',
        actorClass: 'Warrior',
        actorType: 'Player',
        ownerId: null,
        label: 'Warrior',
        color: '#fff',
        points: [],
        maxThreat: 0,
        totalThreat: 0,
        totalDamage: 0,
        totalHealing: 0,
      },
      {
        actorId: 5,
        actorName: 'Pet',
        actorClass: 'Hunter',
        actorType: 'Pet',
        ownerId: 2,
        label: 'Pet (Hunter)',
        color: '#fff',
        points: [],
        maxThreat: 0,
        totalThreat: 0,
        totalDamage: 0,
        totalHealing: 0,
      },
    ]

    const filtered = filterSeriesByPlayers(series, [2])
    expect(filtered.map((entry) => entry.actorId)).toEqual([5])
  })
})
