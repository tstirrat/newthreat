/**
 * Season of Discovery Hunter Threat Configuration Tests
 */
import { checkExists } from '@wcl-threat/shared'
import { describe, expect, it } from 'vitest'

import { createDamageContext } from '../../test/helpers/context'
import { Buffs, hunterConfig } from './hunter'

describe('sod hunter config', () => {
  it('adds ferocity aura modifier', () => {
    const ferocityModifier = hunterConfig.auraModifiers[Buffs.T1Ranged2pc]
    const result = checkExists(
      ferocityModifier?.(
        createDamageContext({
          timestamp: 1000,
          sourceID: 1,
          sourceIsFriendly: true,
          sourceInstance: 0,
          targetID: 99,
          targetIsFriendly: false,
          targetInstance: 0,
          abilityGameID: 1,
        }),
      ),
    )

    expect(result.value).toBe(2)
  })
})
