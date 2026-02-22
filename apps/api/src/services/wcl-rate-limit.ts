/**
 * Helpers for propagating Warcraft Logs rate-limit metadata.
 */

export interface WclRateLimitDetails extends Record<string, unknown> {
  context: string
  retryAfter?: string
  retryAfterSeconds?: number
}

/** Parse Retry-After into whole seconds when possible. */
export function parseRetryAfterSeconds(
  retryAfter: string | null,
): number | null {
  if (!retryAfter) {
    return null
  }

  const seconds = Number(retryAfter)
  if (Number.isFinite(seconds) && seconds >= 0) {
    return Math.ceil(seconds)
  }

  const retryAtMs = Date.parse(retryAfter)
  if (Number.isNaN(retryAtMs)) {
    return null
  }

  const deltaMs = retryAtMs - Date.now()
  return Math.max(0, Math.ceil(deltaMs / 1000))
}

/** Build normalized WCL rate-limit error details from Retry-After. */
export function buildWclRateLimitDetails(
  context: string,
  retryAfter: string | null,
): WclRateLimitDetails {
  const details: WclRateLimitDetails = {
    context,
  }

  const retryAfterSeconds = parseRetryAfterSeconds(retryAfter)

  if (retryAfter) {
    details.retryAfter = retryAfter
  }
  if (retryAfterSeconds !== null) {
    details.retryAfterSeconds = retryAfterSeconds
  }

  return details
}
