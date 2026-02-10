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
