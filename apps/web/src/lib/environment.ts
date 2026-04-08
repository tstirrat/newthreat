/**
 * App environment detection utility.
 *
 * Determines the runtime environment based on the current hostname.
 * Used by Sentry and PostHog to tag events with the correct environment.
 */

/** Runtime environment label for this deployment. */
export type AppEnvironment = 'development' | 'staging' | 'production'

/**
 * Returns the runtime environment based on `window.location.hostname`.
 *
 * - localhost / loopback → `development`
 * - PR preview channels (hostname contains `pr-`) → `staging`
 * - Everything else → `production`
 */
export function getEnvironment(): AppEnvironment {
  const hostname = window.location.hostname
  if (
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname === '[::1]'
  )
    return 'development'
  if (hostname.includes('pr-')) return 'staging'
  return 'production'
}
