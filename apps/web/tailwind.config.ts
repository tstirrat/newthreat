/**
 * Tailwind CSS configuration for the web app.
 */
import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        surface: '#f8fafc',
        panel: '#ffffff',
        border: '#d1d5db',
        text: '#0f172a',
        muted: '#64748b',
      },
    },
  },
  plugins: [],
}

export default config
