/**
 * Paladin Threat Configuration - Season of Discovery
 */
import type { ClassThreatConfig } from '@wcl-threat/shared'
import type { GearItem } from '@wcl-threat/wcl-types'

import {
  Spells as EraSpells,
  paladinConfig as eraPaladinConfig,
} from '../../era/classes/paladin'
import { tauntTarget } from '../../shared/formulas'

export const Spells = {
  ...EraSpells,
  HandOfReckoning: 407631,
  EngraveHandOfReckoning: 410001,
} as const

const Runes = {
  HandOfReckoning: 6844,
} as const

const Mods = {
  HandOfReckoningWithRighteousFury: 1.5,
} as const

function inferGearAuras(gear: GearItem[]): number[] {
  const inheritedAuras = eraPaladinConfig.gearImplications?.(gear) ?? []
  const inferredAuras = new Set<number>(inheritedAuras)

  if (gear.some((item) => item.temporaryEnchant === Runes.HandOfReckoning)) {
    inferredAuras.add(Spells.EngraveHandOfReckoning)
  }

  return [...inferredAuras]
}

export const paladinConfig: ClassThreatConfig = {
  ...eraPaladinConfig,

  auraModifiers: {
    ...eraPaladinConfig.auraModifiers,
    [Spells.EngraveHandOfReckoning]: (ctx) => ({
      source: 'gear',
      name: 'Engrave Gloves - Hand of Reckoning',
      value: ctx.sourceAuras.has(EraSpells.RighteousFury)
        ? Mods.HandOfReckoningWithRighteousFury
        : 1,
    }),
    // TODO: Vengeance
    // TODO: Improved RF
  },

  abilities: {
    ...eraPaladinConfig.abilities,
    [Spells.HandOfReckoning]: tauntTarget({ bonus: 0, eventTypes: ['cast'] }),
  },

  fixateBuffs: new Set([
    ...(eraPaladinConfig.fixateBuffs ?? []),
    Spells.HandOfReckoning,
  ]),
  gearImplications: inferGearAuras,
}
