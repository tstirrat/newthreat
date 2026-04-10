/**
 * Hook that tracks whether the app is currently in dark mode.
 *
 * Listens to the existing `themechange` DOM event dispatched by the theme
 * toggle, mirroring the approach used in `useThreatChartThemeColors`.
 */
import { useEffect, useState } from 'react'

/** Returns true when the app is in dark mode, false in light mode. Re-renders on theme change. */
export function useIsDarkMode(): boolean {
  const [isDark, setIsDark] = useState(() =>
    document.documentElement.classList.contains('dark'),
  )

  useEffect(() => {
    const handler = () =>
      setIsDark(document.documentElement.classList.contains('dark'))
    window.addEventListener('themechange', handler)
    return () => window.removeEventListener('themechange', handler)
  }, [])

  return isDark
}
