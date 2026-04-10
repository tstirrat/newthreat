/**
 * Hunter Threat Configuration - TBC (Anniversary)
 *
 * Inherits Era hunter behavior and adds Misdirection threat redirection.
 */
import type { ClassThreatConfig } from '@wow-threat/shared'

import {
  Spells as EraSpells,
  hunterConfig as eraHunterConfig,
} from '../../era/classes/hunter'
import { threat, threatOnDebuffOrDamage } from '../../shared/formulas'
import { createMisdirectionInterceptor } from '../../shared/misdirection'

export const Spells = {
  ...EraSpells,
  Misdirection: 34477, // https://www.wowhead.com/tbc/spell=34477/
  MisdirectionBuff: 35079, // https://www.wowhead.com/tbc/spell=35079/
  DistractingShotR7: 27020, // https://www.wowhead.com/tbc/spell=27020/
  ExplosiveTrapEffectR1: 13812, // https://www.wowhead.com/tbc/spell=13812/
  ExplosiveTrapEffectR2: 14314, // https://www.wowhead.com/tbc/spell=14314/
  ExplosiveTrapEffectR3: 14315, // https://www.wowhead.com/tbc/spell=14315/
  ExplosiveTrapEffectR4: 27025, // https://www.wowhead.com/tbc/spell=27025/
  PetScreechR5: 27051, // https://www.wowhead.com/tbc/spell=27051/
} as const

export const hunterConfig: ClassThreatConfig = {
  ...eraHunterConfig,

  abilities: {
    ...eraHunterConfig.abilities,
    [Spells.PetScreechR5]: threatOnDebuffOrDamage(210),
    [Spells.DistractingShotR7]: threat({ bonus: 900, eventTypes: ['cast'] }),
    [Spells.Misdirection]: (ctx) => ({
      value: 0,
      splitAmongEnemies: false,
      note: 'misdirection(installInterceptor)',
      effects: [
        {
          type: 'installInterceptor',
          interceptor: createMisdirectionInterceptor(
            ctx.sourceActor.id,
            ctx.event.targetID,
          ),
        },
      ],
    }),
  },
}
