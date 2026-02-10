/**
 * Error panel used across page-level query failures.
 */

export function ErrorState({
  title,
  message,
}: {
  title: string
  message: string
}): JSX.Element {
  return (
    <section className="rounded-xl border border-red-300 bg-red-50 p-6 text-red-900 shadow-sm">
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className="mt-2 text-sm">{message}</p>
    </section>
  )
}
