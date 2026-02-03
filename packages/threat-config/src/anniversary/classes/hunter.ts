/**
 * Hunter Threat Configuration - Anniversary Edition
 *
 * Feign Death drops threat. Distracting Shot generates fixed threat.
 */

import type { ClassThreatConfig } from '../../types'
import { flat, modAmountFlat, threatDrop } from '../../shared/formulas'

// ============================================================================
// Spell IDs
// ============================================================================

export const Spells = {
  FeignDeath: 5384,
  DistractingShotR1: 20736,
  DistractingShotR2: 14274,
  DistractingShotR3: 15629,
  DistractingShotR4: 15630,
  DistractingShotR5: 15631,
  DistractingShotR6: 15632,
  DisengageR1: 781,
  DisengageR2: 14272,
  DisengageR3: 14273,
} as const

// ============================================================================
// Configuration
// ============================================================================

export const hunterConfig: ClassThreatConfig = {
  auraModifiers: {},

  abilities: {
    // Feign Death - threat drop
    [Spells.FeignDeath]: threatDrop(),

    // Distracting Shot - damage + flat threat per rank
    [Spells.DistractingShotR1]: modAmountFlat(1, 110),
    [Spells.DistractingShotR2]: modAmountFlat(1, 160),
    [Spells.DistractingShotR3]: modAmountFlat(1, 250),
    [Spells.DistractingShotR4]: modAmountFlat(1, 350),
    [Spells.DistractingShotR5]: modAmountFlat(1, 465),
    [Spells.DistractingShotR6]: modAmountFlat(1, 600),

    // Disengage - negative threat
    [Spells.DisengageR1]: flat(-140),
    [Spells.DisengageR2]: flat(-280),
    [Spells.DisengageR3]: flat(-405),
  },
}
