/**
 * Guild faction helpers shared across report-list components.
 */

export type ReportGuildFaction = 'alliance' | 'horde' | null

/** Normalize a raw faction string to a typed value, returning null for unknown values. */
export function normalizeGuildFaction(
  value: string | null | undefined,
): ReportGuildFaction {
  if (!value) {
    return null
  }

  const normalized = value.trim().toLowerCase()
  if (normalized === 'alliance') {
    return 'alliance'
  }
  if (normalized === 'horde') {
    return 'horde'
  }

  return null
}

/** Resolve the Tailwind class for a faction-colored title row. */
export function resolveTitleRowClass(faction: ReportGuildFaction): string {
  if (faction === 'alliance') {
    return 'text-sky-600 dark:text-sky-400'
  }
  if (faction === 'horde') {
    return 'text-red-600 dark:text-red-400'
  }

  return ''
}
