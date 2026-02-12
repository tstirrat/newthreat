/**
 * Hunter Threat Configuration - Season of Discovery
 */
import type { ClassThreatConfig } from '@wcl-threat/shared'

import { hunterConfig as eraHunterConfig } from '../../era/classes/hunter'

export const Buffs = {
  T1Ranged2pc: 456339,
} as const

const Mods = {
  T1Ranged2pc: 2,
} as const

export const hunterConfig: ClassThreatConfig = {
  ...eraHunterConfig,
  auraModifiers: {
    ...eraHunterConfig.auraModifiers,
    [Buffs.T1Ranged2pc]: () => ({
      source: 'gear',
      name: 'S03 T1 Hunter Ranged 2pc',
      value: Mods.T1Ranged2pc,
    }),
  },
}
