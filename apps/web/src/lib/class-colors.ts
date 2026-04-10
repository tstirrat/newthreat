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
  Priest: '#FFFFFF',
  'Death Knight': '#C41F3B',
  Shaman: '#0070DE',
  Mage: '#69CCF0',
  Warlock: '#9482C9',
  Monk: '#00FF98',
  Druid: '#FF7D0A',
  'Demon Hunter': '#A330C9',
  Evoker: '#33937F',
}

const lightModeClassColorOverrides: Partial<Record<PlayerClass, string>> = {
  Priest: '#71717a',
}

const fallbackColor = '#94a3b8'

/** Resolve a class color from a class name, with fallback for unknown classes. */
export function getClassColor(
  playerClass: PlayerClass | null | undefined,
  isDarkMode = true,
): string {
  if (!playerClass) {
    return fallbackColor
  }

  if (!isDarkMode) {
    const override = lightModeClassColorOverrides[playerClass]
    if (override) return override
  }

  return classColors[playerClass] ?? fallbackColor
}

/** Resolve an actor display color (players by class, pets by owner class). */
export function getActorColor(
  actor: ReportActorSummary,
  actorsById: Map<number, ReportActorSummary>,
  isDarkMode = true,
): string {
  if (actor.type === 'Player') {
    return getClassColor(actor.subType as PlayerClass | undefined, isDarkMode)
  }

  if (actor.type === 'Pet' && actor.petOwner) {
    const owner = actorsById.get(actor.petOwner)
    if (owner?.type === 'Player') {
      return getClassColor(owner.subType as PlayerClass | undefined, isDarkMode)
    }
  }

  return fallbackColor
}
