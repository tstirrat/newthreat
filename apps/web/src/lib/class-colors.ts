/**
 * Utilities for rendering class-colored player labels and chart series.
 */
import type { PlayerClass } from '@wow-threat/wcl-types'

import type { ReportActorSummary } from '../types/api'

export const classColors: Record<PlayerClass, string> = {
  Warrior: '#C79C6E',
  Paladin: '#F58CBA',
  Hunter: '#ABD473',
  Rogue: '#FFF569',
  Priest: 'var(--foreground)',
  'Death Knight': '#C41F3B',
  Shaman: '#0070DE',
  Mage: '#69CCF0',
  Warlock: '#9482C9',
  Monk: '#00FF98',
  Druid: '#FF7D0A',
  'Demon Hunter': '#A330C9',
  Evoker: '#33937F',
}

const fallbackColor = '#94a3b8'

/**
 * Resolve a CSS variable color string to its computed value for canvas (ECharts) contexts.
 * Returns the input unchanged for non-variable color strings.
 */
export function resolveCssColor(color: string): string {
  if (!color.startsWith('var(')) {
    return color
  }

  const varName = color.slice(4, -1).trim()
  return (
    getComputedStyle(document.documentElement)
      .getPropertyValue(varName)
      .trim() || color
  )
}

/** Resolve a class color from a class name, with fallback for unknown classes. */
export function getClassColor(
  playerClass: PlayerClass | null | undefined,
): string {
  if (!playerClass) {
    return fallbackColor
  }

  return classColors[playerClass] ?? fallbackColor
}

/** Resolve an actor display color (players by class, pets by owner class). */
export function getActorColor(
  actor: ReportActorSummary,
  actorsById: Map<number, ReportActorSummary>,
): string {
  if (actor.type === 'Player') {
    return getClassColor(actor.subType as PlayerClass | undefined)
  }

  if (actor.type === 'Pet' && actor.petOwner) {
    const owner = actorsById.get(actor.petOwner)
    if (owner?.type === 'Player') {
      return getClassColor(owner.subType as PlayerClass | undefined)
    }
  }

  return fallbackColor
}
