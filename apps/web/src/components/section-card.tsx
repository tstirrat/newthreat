/**
 * Shared section wrapper for neutral card-like layout blocks.
 */
import type { PropsWithChildren } from 'react'

export function SectionCard({
  title,
  subtitle,
  children,
}: PropsWithChildren<{ title: string; subtitle?: string }>): JSX.Element {
  return (
    <section className="rounded-xl border border-border bg-panel p-4 shadow-sm">
      <header className="mb-4">
        <h2 className="text-lg font-semibold">{title}</h2>
        {subtitle ? <p className="mt-1 text-sm text-muted">{subtitle}</p> : null}
      </header>
      {children}
    </section>
  )
}
