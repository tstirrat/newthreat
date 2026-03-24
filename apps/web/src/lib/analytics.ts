/**
 * Product analytics module.
 *
 * Uses @posthog/react for React-idiomatic Posthog integration.
 * Renders a no-op provider when VITE_POSTHOG_KEY is absent (local dev).
 *
 * Usage — provider (in app.tsx):
 *   import { PostHogAnalyticsProvider } from '@/lib/analytics'
 *   <PostHogAnalyticsProvider><App /></PostHogAnalyticsProvider>
 *
 * Usage — hook (inside React components):
 *   import { useAnalytics } from '@/lib/analytics'
 *   const analytics = useAnalytics()
 *   analytics.capture('fight_viewed', { fightId, reportId })
 */
import { PostHogProvider, usePostHog } from '@posthog/react'
import type { ReactNode } from 'react'

// ---------------------------------------------------------------------------
// Typed event catalogue
// ---------------------------------------------------------------------------

export type AnalyticsEvent =
  | { event: 'page_viewed'; props: { path: string } }
  | { event: 'report_viewed'; props: { reportId: string } }
  | { event: 'fight_viewed'; props: { reportId: string; fightId: string } }
  | { event: 'entity_reports_viewed'; props: { entityType: string; entityId: string } }
  | { event: 'wcl_auth_initiated'; props?: Record<string, unknown> }
  | { event: 'wcl_auth_completed'; props?: Record<string, unknown> }
  | { event: 'fight_target_filter_changed'; props: { targetName: string | null } }
  | { event: 'fight_player_toggled'; props: { playerName: string; visible: boolean } }

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

interface PostHogAnalyticsProviderProps {
  children: ReactNode
}

export function PostHogAnalyticsProvider({ children }: PostHogAnalyticsProviderProps): JSX.Element {
  const key = import.meta.env.VITE_POSTHOG_KEY as string | undefined
  const host = (import.meta.env.VITE_POSTHOG_HOST as string | undefined) ?? 'https://us.i.posthog.com'

  if (!key) {
    // No-op: render children without Posthog when key is absent.
    return children as JSX.Element
  }

  return (
    <PostHogProvider
      apiKey={key}
      options={{
        api_host: host,
        // Disable automatic pageview capture — we fire them manually after
        // React Router navigation so they include the correct URL.
        capture_pageview: false,
        // Keep autocapture on for click/form events (cheap signal for CEO usage view).
        autocapture: true,
        persistence: 'localStorage+cookie',
      }}
    >
      {children}
    </PostHogProvider>
  )
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

interface AnalyticsHook {
  capture<E extends AnalyticsEvent['event']>(
    event: E,
    props?: Extract<AnalyticsEvent, { event: E }>['props'],
  ): void
  identify(uid: string, traits?: Record<string, unknown>): void
  reset(): void
  pageview(path: string): void
}

/**
 * React hook that provides typed analytics methods backed by Posthog.
 * All methods are safe no-ops when Posthog is not initialized.
 */
export function useAnalytics(): AnalyticsHook {
  const posthog = usePostHog()

  return {
    capture<E extends AnalyticsEvent['event']>(
      event: E,
      props?: Extract<AnalyticsEvent, { event: E }>['props'],
    ): void {
      posthog?.capture(event, props ?? {})
    },

    identify(uid: string, traits?: Record<string, unknown>): void {
      posthog?.identify(uid, traits)
    },

    reset(): void {
      posthog?.reset()
    },

    pageview(path: string): void {
      posthog?.capture('$pageview', { $current_url: path })
    },
  }
}
