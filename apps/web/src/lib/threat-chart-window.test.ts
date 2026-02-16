/**
 * Unit tests for threat chart window normalization helpers.
 */
import { describe, expect, it } from 'vitest'

import {
  isFullWindowRange,
  resolveDataZoomWindowRange,
} from './threat-chart-window'

describe('threat-chart-window', () => {
  it('resolves direct startValue/endValue payloads', () => {
    expect(
      resolveDataZoomWindowRange({
        bounds: { min: 0, max: 10_000 },
        payloads: [{ startValue: 1200.4, endValue: 7899.8 }],
      }),
    ).toEqual({
      startMs: 1200,
      endMs: 7900,
    })
  })

  it('resolves start/end percentage payloads', () => {
    expect(
      resolveDataZoomWindowRange({
        bounds: { min: 1000, max: 9000 },
        payloads: [{ start: 25, end: 75 }],
      }),
    ).toEqual({
      startMs: 3000,
      endMs: 7000,
    })
  })

  it('falls back to later payloads when earlier payloads are incomplete', () => {
    expect(
      resolveDataZoomWindowRange({
        bounds: { min: 0, max: 10_000 },
        payloads: [{ startValue: 1000 }, { start: 10, end: 40 }],
      }),
    ).toEqual({
      startMs: 1000,
      endMs: 4000,
    })
  })

  it('returns null when no valid range can be resolved', () => {
    expect(
      resolveDataZoomWindowRange({
        bounds: { min: 0, max: 10_000 },
        payloads: [{ start: 40, end: 40 }, {}, null],
      }),
    ).toBeNull()
  })

  it('detects full-range windows with rounding tolerance', () => {
    expect(
      isFullWindowRange({
        bounds: { min: 0, max: 10_000 },
        range: {
          startMs: 1,
          endMs: 9_999,
        },
      }),
    ).toBe(true)

    expect(
      isFullWindowRange({
        bounds: { min: 0, max: 10_000 },
        range: {
          startMs: 100,
          endMs: 9_000,
        },
      }),
    ).toBe(false)
  })
})
