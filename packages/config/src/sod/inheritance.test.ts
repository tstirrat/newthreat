/**
 * Tests for SoD inheritance and composition from Era defaults.
 */
import { describe, expect, it } from 'vitest'

import { aq20AggroLossBuffs } from '../era/raids/aq20'
import {
  aq40AggroLossBuffs,
  aq40AuraModifiers as eraAq40AuraModifiers,
} from '../era/raids/aq40'
import { bwlAbilities as eraBwlAbilities } from '../era/raids/bwl'
import { mcAggroLossBuffs } from '../era/raids/mc'
import { naxxAbilities as eraNaxxAbilities } from '../era/raids/naxx'
import { onyxiaAbilities as eraOnyxiaAbilities } from '../era/raids/ony'
import { ZgEncounterIds } from '../era/raids/zg'
import { sodConfig } from './'

describe('sod inheritance defaults', () => {
  it('inherits onyxia abilities from era', () => {
    const fireball = 18392
    expect(sodConfig.abilities?.[fireball]).toBe(eraOnyxiaAbilities[fireball])
  })

  it('inherits naxx abilities from era', () => {
    const magneticPull = 28339
    expect(sodConfig.abilities?.[magneticPull]).toBe(
      eraNaxxAbilities[magneticPull],
    )
  })

  it('inherits bwl abilities from era', () => {
    // Broodlord Knock Away
    const broodlordKnockAway = 18670
    expect(sodConfig.abilities?.[broodlordKnockAway]).toBe(
      eraBwlAbilities[broodlordKnockAway],
    )
  })

  it('inherits era aq40 aura modifiers', () => {
    const fetishOfTheSandReaver = 26400
    expect(sodConfig.auraModifiers?.[fetishOfTheSandReaver]).toBe(
      eraAq40AuraModifiers[fetishOfTheSandReaver],
    )
  })

  it('inherits era zg encounters', () => {
    expect(
      sodConfig.encounters?.[ZgEncounterIds.HighPriestessArlokk],
    ).toBeDefined()
  })

  it('inherits era aggro-loss buffs', () => {
    // MC: Lucifron Dominate Mind
    for (const spellId of mcAggroLossBuffs) {
      expect(sodConfig.aggroLossBuffs?.has(spellId)).toBe(true)
    }
    // AQ40: Princess Yauj Fear
    for (const spellId of aq40AggroLossBuffs) {
      expect(sodConfig.aggroLossBuffs?.has(spellId)).toBe(true)
    }
    // AQ20: Ossirian Enveloping Winds
    for (const spellId of aq20AggroLossBuffs) {
      expect(sodConfig.aggroLossBuffs?.has(spellId)).toBe(true)
    }
  })
})
