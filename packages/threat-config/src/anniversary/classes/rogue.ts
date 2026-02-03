/**
 * Rogue Threat Configuration - Anniversary Edition
 *
 * Rogues have a base 0.71x threat coefficient for all actions.
 */

import type { ClassThreatConfig } from '../../types'
import { flat, threatDrop, noThreat } from '../../shared/formulas'

// ============================================================================
// Spell IDs
// ============================================================================

export const Spells = {
  VanishR1: 1856,
  VanishR2: 1857,
  FeintR1: 1966,
  FeintR2: 6768,
  FeintR3: 8637,
  FeintR4: 11303,
  FeintR5: 25302,
} as const

// ============================================================================
// Modifiers
// ============================================================================

const Mods = {
  Base: 0.71,
}

// ============================================================================
// Configuration
// ============================================================================

export const rogueConfig: ClassThreatConfig = {
  baseThreatFactor: Mods.Base,

  auraModifiers: {},

  abilities: {
    // Vanish - threat drop
    [Spells.VanishR1]: threatDrop(),
    [Spells.VanishR2]: threatDrop(),

    // Feint - negative threat (no coefficient applied)
    [Spells.FeintR1]: flat(-150),
    [Spells.FeintR2]: flat(-240),
    [Spells.FeintR3]: flat(-390),
    [Spells.FeintR4]: flat(-600),
    [Spells.FeintR5]: flat(-800),
  },
}
