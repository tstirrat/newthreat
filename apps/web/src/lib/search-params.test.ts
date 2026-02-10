/**
 * Unit tests for fight query param parsing utilities.
 */
import { describe, expect, it } from 'vitest'

import {
  applyFightQueryState,
  parsePlayersParam,
  parseTargetIdParam,
  parseWindowParams,
  resolveFightQueryState,
} from './search-params'

describe('search-params', () => {
  it('parses player IDs from comma-separated values', () => {
    expect(parsePlayersParam('1,2,abc,3')).toEqual([1, 2, 3])
  })

  it('validates target ID against valid targets', () => {
    const valid = new Set([10, 20])
    expect(parseTargetIdParam('10', valid)).toBe(10)
    expect(parseTargetIdParam('30', valid)).toBeNull()
  })

  it('parses valid windows and rejects invalid windows', () => {
    expect(parseWindowParams('100', '200', 500)).toEqual({
      startMs: 100,
      endMs: 200,
    })

    expect(parseWindowParams('100', null, 500)).toEqual({
      startMs: null,
      endMs: null,
    })

    expect(parseWindowParams('300', '200', 500)).toEqual({
      startMs: null,
      endMs: null,
    })
  })

  it('resolves fight query state with fallback behavior', () => {
    const params = new URLSearchParams({
      players: '1,2,999',
      targetId: '20',
      startMs: '100',
      endMs: '200',
    })

    expect(
      resolveFightQueryState({
        searchParams: params,
        validPlayerIds: new Set([1, 2]),
        validTargetIds: new Set([20]),
        maxDurationMs: 1000,
      }),
    ).toEqual({
      players: [1, 2],
      targetId: 20,
      startMs: 100,
      endMs: 200,
    })
  })

  it('applies fight query state updates', () => {
    const next = applyFightQueryState(new URLSearchParams(), {
      players: [1, 2],
      targetId: 99,
      startMs: 10,
      endMs: 80,
    })

    expect(next.toString()).toContain('players=1%2C2')
    expect(next.toString()).toContain('targetId=99')
    expect(next.toString()).toContain('startMs=10')
    expect(next.toString()).toContain('endMs=80')
  })
})
