/**
 * Not found page for unmatched routes.
 */
import type { FC } from 'react'
import { Link } from 'react-router-dom'

export const NotFoundPage: FC = () => {
  return (
    <section className="rounded-xl border border-border bg-panel p-6 shadow-sm">
      <h1 className="text-xl font-semibold">Page not found</h1>
      <p className="mt-2 text-sm text-muted">
        The requested route does not exist.
      </p>
      <Link
        className="mt-4 inline-flex rounded-md border border-border px-3 py-2 text-sm font-medium"
        to="/"
      >
        Return home
      </Link>
    </section>
  )
}
