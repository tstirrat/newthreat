/**
 * Root application component with providers.
 */
import { AuthProvider } from '@/auth/auth-provider'
import { ThemeProvider } from '@/components/theme-provider'
import { ReportIndexProvider } from '@/hooks/use-report-index'
import { UserSettingsProvider } from '@/hooks/use-user-settings'
import { QueryClientProvider } from '@tanstack/react-query'
import type { FC } from 'react'
import { HotkeysProvider } from 'react-hotkeys-hook'
import { RouterProvider } from 'react-router-dom'

import { PostHogAnalyticsProvider } from './lib/analytics'
import { SentryErrorBoundary } from './lib/monitoring'
import { createQueryClient } from './lib/query-client'
import { router } from './routes/router'

const queryClient = createQueryClient()

export const App: FC = () => {
  return (
    <SentryErrorBoundary fallback={<p>Something went wrong. Please refresh the page.</p>}>
      <PostHogAnalyticsProvider>
        <AuthProvider>
          <UserSettingsProvider>
            <QueryClientProvider client={queryClient}>
              <ReportIndexProvider>
                <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
                  <HotkeysProvider>
                    <RouterProvider router={router} />
                  </HotkeysProvider>
                </ThemeProvider>
              </ReportIndexProvider>
            </QueryClientProvider>
          </UserSettingsProvider>
        </AuthProvider>
      </PostHogAnalyticsProvider>
    </SentryErrorBoundary>
  )
}
