/**
 * Anniversary Edition Threat Configuration
 *
 * Anniversary config for WCL gameVersion 2 reports that resolve to
 * Anniversary-specific metadata (season/partition).
 */
import type { ThreatContext, ThreatModifier } from '@wow-threat/shared'
import type { GearItem } from '@wow-threat/wcl-types'

import { eraConfig } from '../era'
import { extendConfig } from '../shared/extend-config'
import {
  FRESH_TBC_CUTOVER_TIMESTAMP_MS,
  getClassicSeasonIds,
  hasZonePartition,
  isSupportedClassicGameVersion,
  validateAbilities,
  validateAuraModifiers,
} from '../shared/utils'
import { druidConfig } from './classes/druid'
import { hunterConfig } from './classes/hunter'
import { mageConfig } from './classes/mage'
import { paladinConfig } from './classes/paladin'
import { priestConfig } from './classes/priest'
import { rogueConfig } from './classes/rogue'
import { shamanConfig } from './classes/shaman'
import { warlockConfig } from './classes/warlock'
import { warriorConfig } from './classes/warrior'
import { miscAbilities } from './misc'
import {
  blackTempleAbilities,
  blackTempleAuraModifiers,
  blackTempleFixateBuffs,
} from './raids/black-temple'
import { commonRaidAbilities } from './raids/common'
import { gruulsLairAbilities } from './raids/gruuls-lair'
import { karazhanAbilities } from './raids/karazhan'
import { naxxAbilities } from './raids/naxx'
import { serpentshrineCavernAbilities } from './raids/serpentshrine-cavern'
import { tempestKeepAbilities } from './raids/tempest-keep'

const ANNIVERSARY_CLASSIC_SEASON_ID = 5
const Enchants = {
  GlovesThreat: 2613,
  CloakSubtlety: 2621,
} as const

// Global aura modifiers (items, consumables, cross-class buffs)
const auraModifiers: Record<number, (ctx: ThreatContext) => ThreatModifier> = {
  ...blackTempleAuraModifiers,
  [Enchants.GlovesThreat]: () => ({
    source: 'gear',
    name: 'Enchant Gloves - Threat',
    value: 1.02,
  }),
  [Enchants.CloakSubtlety]: () => ({
    source: 'gear',
    name: 'Enchant Cloak - Subtlety',
    value: 0.98,
  }),
}

function inferGlobalGearAuras(gear: GearItem[]): number[] {
  const inferredAuras: number[] = []

  if (gear.some((item) => item.permanentEnchant === Enchants.GlovesThreat)) {
    inferredAuras.push(Enchants.GlovesThreat)
  }
  if (gear.some((item) => item.permanentEnchant === Enchants.CloakSubtlety)) {
    inferredAuras.push(Enchants.CloakSubtlety)
  }

  return inferredAuras
}

export const anniversaryConfig = extendConfig(eraConfig, {
  version: 14,
  displayName: 'TBC (Anniversary)',
  wowhead: {
    domain: 'tbc',
  },
  resolve: (input) => {
    if (!isSupportedClassicGameVersion(input.report.masterData.gameVersion)) {
      return false
    }

    if (input.report.startTime < FRESH_TBC_CUTOVER_TIMESTAMP_MS) {
      return false
    }

    const seasonIds = getClassicSeasonIds(input)
    if (seasonIds.length > 0) {
      return seasonIds.includes(ANNIVERSARY_CLASSIC_SEASON_ID)
    }

    if (!hasZonePartition(input, ['phase', 'pre-patch'])) {
      return false
    }

    return true
  },

  classes: {
    warrior: warriorConfig,
    paladin: paladinConfig,
    druid: druidConfig,
    priest: priestConfig,
    rogue: rogueConfig,
    hunter: hunterConfig,
    mage: mageConfig,
    warlock: warlockConfig,
    shaman: shamanConfig,
  },

  abilities: {
    ...naxxAbilities,
    ...commonRaidAbilities,
    ...karazhanAbilities,
    ...serpentshrineCavernAbilities,
    ...tempestKeepAbilities,
    ...gruulsLairAbilities,
    ...blackTempleAbilities,
    ...miscAbilities,
  },

  auraModifiers,
  gearImplications: inferGlobalGearAuras,
  fixateBuffs: blackTempleFixateBuffs,
})

// Validate for duplicate spell IDs (dev-time warning)
validateAuraModifiers(anniversaryConfig)
validateAbilities(anniversaryConfig)
