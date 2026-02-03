/**
 * Priest Threat Configuration - Anniversary Edition
 *
 * Mind Blast generates extra threat. Silent Resolve and Shadow Affinity talents reduce threat.
 */

import type { ClassThreatConfig } from '../../types'
import { modAmountFlat, noThreat } from '../../shared/formulas'

// ============================================================================
// Spell IDs
// ============================================================================

export const Spells = {
  // Mind Blast (extra threat per rank)
  MindBlastR1: 8092,
  MindBlastR2: 8102,
  MindBlastR3: 8103,
  MindBlastR4: 8104,
  MindBlastR5: 8105,
  MindBlastR6: 8106,
  MindBlastR7: 10945,
  MindBlastR8: 10946,
  MindBlastR9: 10947,

  // Holy Nova - zero threat
  HolyNovaDmgR1: 15237,
  HolyNovaDmgR2: 15430,
  HolyNovaDmgR3: 15431,
  HolyNovaDmgR4: 27799,
  HolyNovaDmgR5: 27800,
  HolyNovaDmgR6: 27801,
  HolyNovaHealR1: 23455,
  HolyNovaHealR2: 23458,
  HolyNovaHealR3: 23459,
  HolyNovaHealR4: 27803,
  HolyNovaHealR5: 27804,
  HolyNovaHealR6: 27805,

  // Weakened Soul - zero threat
  WeakenedSoul: 6788,
} as const

// ============================================================================
// Configuration
// ============================================================================

export const priestConfig: ClassThreatConfig = {
  auraModifiers: {
    // TODO: [Silent Resolve] Talent - 4% per rank (up to 20%) threat reduction
    // TODO: [Shadow Affinity] Talent - 8.33% per rank (up to 25%) shadow threat reduction
  },

  abilities: {
    // Mind Blast - damage + flat threat per rank
    [Spells.MindBlastR1]: modAmountFlat(1, 40),
    [Spells.MindBlastR2]: modAmountFlat(1, 77),
    [Spells.MindBlastR3]: modAmountFlat(1, 121),
    [Spells.MindBlastR4]: modAmountFlat(1, 180),
    [Spells.MindBlastR5]: modAmountFlat(1, 236),
    [Spells.MindBlastR6]: modAmountFlat(1, 303),
    [Spells.MindBlastR7]: modAmountFlat(1, 380),
    [Spells.MindBlastR8]: modAmountFlat(1, 460),
    [Spells.MindBlastR9]: modAmountFlat(1, 540),

    // Holy Nova - zero threat
    [Spells.HolyNovaDmgR1]: noThreat(),
    [Spells.HolyNovaDmgR2]: noThreat(),
    [Spells.HolyNovaDmgR3]: noThreat(),
    [Spells.HolyNovaDmgR4]: noThreat(),
    [Spells.HolyNovaDmgR5]: noThreat(),
    [Spells.HolyNovaDmgR6]: noThreat(),
    [Spells.HolyNovaHealR1]: noThreat(),
    [Spells.HolyNovaHealR2]: noThreat(),
    [Spells.HolyNovaHealR3]: noThreat(),
    [Spells.HolyNovaHealR4]: noThreat(),
    [Spells.HolyNovaHealR5]: noThreat(),
    [Spells.HolyNovaHealR6]: noThreat(),

    // Weakened Soul - zero threat
    [Spells.WeakenedSoul]: noThreat(),
  },
}
