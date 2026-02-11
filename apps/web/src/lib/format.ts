/**
 * Common formatting helpers for numeric and date-like values.
 */

/** Format a number with thousands separators and no fixed precision. */
export function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-US').format(Math.round(value))
}

/** Format milliseconds into a compact seconds label. */
export function formatSeconds(valueMs: number): string {
  return `${(valueMs / 1000).toFixed(1)}s`
}

/** Format milliseconds into m:ss.mmm for timeline axis/tooltip display. */
export function formatTimelineTime(valueMs: number): string {
  const safeValueMs = Math.max(0, Math.round(valueMs))
  const minutes = Math.floor(safeValueMs / 60_000)
  const seconds = Math.floor((safeValueMs % 60_000) / 1_000)
  const milliseconds = safeValueMs % 1_000

  return `${minutes}:${String(seconds).padStart(2, '0')}.${String(milliseconds).padStart(3, '0')}`
}
