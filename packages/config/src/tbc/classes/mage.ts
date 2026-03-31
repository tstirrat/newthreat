/**
 * Anniversary mage deltas over Era.
 *
 * Applies TBC talent coefficients and threat-drop behavior.
 */
import type { ClassThreatConfig, EventInterceptor } from '@wow-threat/shared'
import { SpellSchool } from '@wow-threat/shared'

import {
  Mods as EraMods,
  Spells as EraSpells,
  mageConfig as eraMageConfig,
} from '../../era/classes/mage'

export const Spells = {
  ...EraSpells,
  Invisibility: 66, // https://www.wowhead.com/tbc/spell=66/
} as const

export const Mods = {
  ...EraMods,
} as const

/** Create an Invisibility interceptor that applies time-based threat reduction on removebuff. */
export function createInvisibilityInterceptor(
  sourceId: number,
  spellId: number,
): EventInterceptor {
  return (event, ctx) => {
    if (
      event.type !== 'removebuff' ||
      event.abilityGameID !== spellId ||
      event.sourceID !== sourceId
    ) {
      return { action: 'passthrough' }
    }

    const nbSeconds = Math.floor((ctx.timestamp - ctx.installedAt) / 1000)
    const targetMultiplier = Math.max(0, 1 - nbSeconds * 0.2)
    const correctionMultiplier = targetMultiplier / 0.8
    ctx.uninstall()

    return {
      action: 'augment',
      effects: [
        {
          type: 'modifyThreat',
          multiplier: correctionMultiplier,
          target: 'all',
        },
      ],
    }
  }
}

export const mageConfig: ClassThreatConfig = {
  ...eraMageConfig,

  auraModifiers: {
    ...eraMageConfig.auraModifiers,

    [Spells.BurningSoulRank1]: () => ({
      source: 'talent',
      name: 'Burning Soul (Rank 1)',
      value: 1 - Mods.BurningSoul,
      schoolMask: SpellSchool.Fire,
    }),
    [Spells.BurningSoulRank2]: () => ({
      source: 'talent',
      name: 'Burning Soul (Rank 2)',
      value: 1 - Mods.BurningSoul * 2,
      schoolMask: SpellSchool.Fire,
    }),

    [Spells.FrostChannelingRank1]: () => ({
      source: 'talent',
      name: 'Frost Channeling (Rank 1)',
      value: 0.966667,
      schoolMask: SpellSchool.Frost,
    }),
    [Spells.FrostChannelingRank2]: () => ({
      source: 'talent',
      name: 'Frost Channeling (Rank 2)',
      value: 0.933333,
      schoolMask: SpellSchool.Frost,
    }),
    [Spells.FrostChannelingRank3]: () => ({
      source: 'talent',
      name: 'Frost Channeling (Rank 3)',
      value: 0.9,
      schoolMask: SpellSchool.Frost,
    }),
  },

  abilities: {
    ...eraMageConfig.abilities,
    [Spells.Invisibility]: (ctx) => {
      if (ctx.event.type !== 'applybuff') return undefined

      return {
        value: 0,
        splitAmongEnemies: false,
        note: 'invisibility(applybuff)',
        effects: [
          { type: 'modifyThreat', multiplier: 0.8, target: 'all' },
          {
            type: 'installInterceptor',
            interceptor: createInvisibilityInterceptor(
              ctx.event.sourceID,
              Spells.Invisibility,
            ),
          },
        ],
      }
    },
  },
}
