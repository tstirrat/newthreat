/**
 * Simple loading panel used across pages.
 */

export function LoadingState({ message }: { message: string }): JSX.Element {
  return (
    <section className="rounded-xl border border-border bg-panel p-6 shadow-sm">
      <p className="text-sm text-muted">{message}</p>
    </section>
  )
}
