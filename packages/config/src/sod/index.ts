/**
 * Season of Discovery Threat Configuration
 *
 * Ports upstream SoD global behavior from:
 * https://github.com/Voomlz/voomlz.github.io/blob/master/sod/spells.js
 */
import type { ThreatContext, ThreatModifier } from '@wow-threat/shared'
import type { GearItem } from '@wow-threat/wcl-types'

import { eraConfig } from '../era'
import { extendConfig } from '../shared/extend-config'
import {
  getClassicSeasonIds,
  hasZonePartition,
  isSupportedClassicGameVersion,
  validateAbilities,
  validateAuraModifiers,
} from '../shared/utils'
import { sodClasses } from './classes'
import { miscAbilities } from './misc'
import { aq40Abilities } from './raids/aq40'
import { mcAbilities } from './raids/mc'
import { zgAbilities } from './raids/zg'

// ============================================================================
// SoD Constants
// ============================================================================

const SOD_CLASSIC_SEASON_ID = 3

const Items = {
  EnchantGlovesThreat: 25072,
  EnchantCloakSubtlety: 25084,
  EyeOfDiminution: 1219503,
} as const

const Mods = {
  GlovesThreat: 1.02,
  CloakSubtlety: 0.98,
  EyeOfDiminution: 0.3,
} as const

const auraModifiers: Record<number, (ctx: ThreatContext) => ThreatModifier> = {
  [Items.EnchantGlovesThreat]: () => ({
    source: 'gear',
    name: 'Enchant Gloves - Threat',
    value: Mods.GlovesThreat,
  }),
  [Items.EnchantCloakSubtlety]: () => ({
    source: 'gear',
    name: 'Enchant Cloak - Subtlety',
    value: Mods.CloakSubtlety,
  }),
  [Items.EyeOfDiminution]: () => ({
    source: 'gear',
    name: 'The Eye of Diminution',
    value: Mods.EyeOfDiminution,
  }),
}

function inferGlobalGearAuras(gear: GearItem[]): number[] {
  const inferredAuras: number[] = []

  if (
    gear.some((item) => item.permanentEnchant === Items.EnchantGlovesThreat)
  ) {
    inferredAuras.push(Items.EnchantGlovesThreat)
  }

  if (
    gear.some((item) => item.permanentEnchant === Items.EnchantCloakSubtlety)
  ) {
    inferredAuras.push(Items.EnchantCloakSubtlety)
  }

  return inferredAuras
}

export const sodConfig = extendConfig(eraConfig, {
  version: 14,
  displayName: 'Season of Discovery',
  resolve: (input) => {
    if (!isSupportedClassicGameVersion(input.report.masterData.gameVersion)) {
      return false
    }

    const seasonIds = getClassicSeasonIds(input)
    if (seasonIds.length > 0) {
      return seasonIds.includes(SOD_CLASSIC_SEASON_ID)
    }

    return hasZonePartition(input, ['discovery'])
  },

  classes: sodClasses,
  abilities: {
    ...mcAbilities,
    ...zgAbilities,
    ...aq40Abilities,
    ...miscAbilities,
  },

  auraModifiers,
  gearImplications: inferGlobalGearAuras,
})

validateAuraModifiers(sodConfig)
validateAbilities(sodConfig)
