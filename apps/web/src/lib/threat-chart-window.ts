/**
 * Helpers for normalizing ECharts dataZoom payloads into chart-window bounds.
 */

export interface DataZoomWindowPayload {
  start?: number
  end?: number
  startValue?: number
  endValue?: number
}

interface ChartWindowBounds {
  min: number
  max: number
}

export interface ChartWindowRange {
  startMs: number
  endMs: number
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

function resolveBoundaryValue({
  value,
  percent,
  bounds,
}: {
  value: number | undefined
  percent: number | undefined
  bounds: ChartWindowBounds
}): number | null {
  if (Number.isFinite(value)) {
    return value ?? null
  }

  if (!Number.isFinite(percent)) {
    return null
  }

  const span = bounds.max - bounds.min
  return bounds.min + ((percent ?? 0) / 100) * span
}

function normalizeWindowRange({
  start,
  end,
  bounds,
}: {
  start: number
  end: number
  bounds: ChartWindowBounds
}): ChartWindowRange | null {
  if (!Number.isFinite(start) || !Number.isFinite(end)) {
    return null
  }

  const startMs = clamp(Math.round(start), bounds.min, bounds.max)
  const endMs = clamp(Math.round(end), bounds.min, bounds.max)

  if (bounds.max === bounds.min) {
    return {
      startMs: bounds.min,
      endMs: bounds.max,
    }
  }

  if (startMs >= endMs) {
    return null
  }

  return { startMs, endMs }
}

/** Resolve a concrete chart window range from one or more dataZoom payloads. */
export function resolveDataZoomWindowRange({
  bounds,
  payloads,
}: {
  bounds: ChartWindowBounds
  payloads: Array<DataZoomWindowPayload | null | undefined>
}): ChartWindowRange | null {
  return payloads.reduce<ChartWindowRange | null>((resolved, payload) => {
    if (resolved || !payload) {
      return resolved
    }

    const start = resolveBoundaryValue({
      value: payload.startValue,
      percent: payload.start,
      bounds,
    })
    const end = resolveBoundaryValue({
      value: payload.endValue,
      percent: payload.end,
      bounds,
    })
    if (start === null || end === null) {
      return null
    }

    return normalizeWindowRange({ start, end, bounds })
  }, null)
}

/** Determine whether a chart window effectively spans the full chart bounds. */
export function isFullWindowRange({
  bounds,
  range,
}: {
  bounds: ChartWindowBounds
  range: ChartWindowRange
}): boolean {
  if (bounds.min === bounds.max) {
    return true
  }

  return range.startMs <= bounds.min + 1 && range.endMs >= bounds.max - 1
}
