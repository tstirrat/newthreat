/**
 * Tests for Mage Threat Configuration
 */
import { createDamageEvent, createMockActorContext } from '@wow-threat/shared'
import type {
  TalentImplicationContext,
  ThreatContext,
} from '@wow-threat/shared/src/types'
import { SpellSchool } from '@wow-threat/shared/src/types'
import { describe, expect, it } from 'vitest'

import { Spells, mageConfig } from './mage'

function createMockContext(
  overrides: Partial<ThreatContext> = {},
): ThreatContext {
  return {
    event: createDamageEvent({ abilityGameID: 0 }),
    amount: 100,
    spellSchoolMask: SpellSchool.Physical,
    sourceAuras: new Set(),
    targetAuras: new Set(),
    sourceActor: { id: 1, name: 'TestMage', class: 'mage' },
    targetActor: { id: 2, name: 'TestEnemy', class: null },
    encounterId: null,
    actors: createMockActorContext(),
    ...overrides,
  }
}

function createTalentContext(
  overrides: Partial<TalentImplicationContext> = {},
): TalentImplicationContext {
  return {
    event: {
      timestamp: 0,
      type: 'combatantinfo',
      sourceID: 1,
      targetID: 1,
    },
    sourceActor: { id: 1, name: 'TestMage', class: 'mage' },
    talentPoints: [0, 0, 0],
    talentRanks: new Map(),
    specId: null,
    ...overrides,
  }
}

describe('Mage Config', () => {
  describe('auraModifiers', () => {
    it('returns Arcane Subtlety rank 2 modifier', () => {
      const modifierFn = mageConfig.auraModifiers[Spells.ArcaneSubtletyRank2]
      expect(modifierFn).toBeDefined()

      const modifier = modifierFn!(
        createMockContext({ spellSchoolMask: SpellSchool.Arcane }),
      )

      expect(modifier.name).toBe('Arcane Subtlety (Rank 2)')
      expect(modifier.value).toBe(0.6)
      expect(modifier.source).toBe('talent')
      expect(modifier.schoolMask).toBe(SpellSchool.Arcane)
    })

    it('returns Burning Soul rank 2 modifier with fire schoolMask', () => {
      const modifierFn = mageConfig.auraModifiers[Spells.BurningSoulRank2]
      expect(modifierFn).toBeDefined()

      const modifier = modifierFn!(
        createMockContext({ spellSchoolMask: SpellSchool.Fire }),
      )

      expect(modifier.name).toBe('Burning Soul (Rank 2)')
      expect(modifier.value).toBe(0.7)
      expect(modifier.source).toBe('talent')
      expect(modifier.schoolMask).toBe(SpellSchool.Fire)
    })
  })

  describe('talentImplications', () => {
    it('infers all configured mage talent auras', () => {
      const result = mageConfig.talentImplications!(
        createTalentContext({
          talentRanks: new Map([
            [Spells.ArcaneSubtletyRank2, 1],
            [Spells.BurningSoulRank2, 1],
            [Spells.FrostChannelingRank3, 1],
          ]),
        }),
      )

      expect(result).toEqual([
        Spells.ArcaneSubtletyRank2,
        Spells.BurningSoulRank2,
        Spells.FrostChannelingRank3,
      ])
    })

    it('infers Arcane Subtlety rank 2 when arcane tree is dominant', () => {
      const result = mageConfig.talentImplications!(
        createTalentContext({
          talentPoints: [31, 10, 10],
        }),
      )

      expect(result).toEqual([Spells.ArcaneSubtletyRank2])
    })

    it('infers Arcane Subtlety rank 2 when arcane tree points meet threshold', () => {
      const result = mageConfig.talentImplications!(
        createTalentContext({
          talentPoints: [21, 30, 0],
        }),
      )

      expect(result).toEqual([
        Spells.ArcaneSubtletyRank2,
        Spells.BurningSoulRank2,
      ])
    })

    it('infers only Burning Soul when fire is dominant and arcane below threshold', () => {
      const result = mageConfig.talentImplications!(
        createTalentContext({
          talentPoints: [20, 21, 10],
        }),
      )

      expect(result).toEqual([Spells.BurningSoulRank2])
    })

    it('prefers explicit Arcane Subtlety rank over tree inference', () => {
      const result = mageConfig.talentImplications!(
        createTalentContext({
          talentPoints: [31, 10, 10],
          talentRanks: new Map([[Spells.ArcaneSubtletyRank1, 1]]),
        }),
      )

      expect(result).toEqual([Spells.ArcaneSubtletyRank1])
    })

    it('infers Burning Soul rank 2 from fire tree split threshold', () => {
      const result = mageConfig.talentImplications!(
        createTalentContext({
          talentPoints: [0, 12, 39],
        }),
      )

      expect(result).toEqual([
        Spells.BurningSoulRank2,
        Spells.FrostChannelingRank3,
      ])
    })

    it('infers Burning Soul rank 2 when fire tree is dominant', () => {
      const result = mageConfig.talentImplications!(
        createTalentContext({
          talentPoints: [10, 31, 10],
        }),
      )

      expect(result).toEqual([Spells.BurningSoulRank2])
    })

    it('does not infer Burning Soul when fire tree points are below threshold', () => {
      const result = mageConfig.talentImplications!(
        createTalentContext({
          talentPoints: [20, 11, 20],
        }),
      )

      expect(result).toEqual([])
    })

    it('prefers explicit Burning Soul rank over tree-split inference', () => {
      const result = mageConfig.talentImplications!(
        createTalentContext({
          talentPoints: [0, 12, 39],
          talentRanks: new Map([[Spells.BurningSoulRank1, 1]]),
        }),
      )

      expect(result).toEqual([
        Spells.BurningSoulRank1,
        Spells.FrostChannelingRank3,
      ])
    })

    it('infers Frost Channeling rank 3 when frost tree is dominant', () => {
      const result = mageConfig.talentImplications!(
        createTalentContext({
          talentPoints: [10, 10, 31],
        }),
      )

      expect(result).toEqual([Spells.FrostChannelingRank3])
    })

    it('infers Frost Channeling rank 3 when frost tree points meet threshold', () => {
      const result = mageConfig.talentImplications!(
        createTalentContext({
          talentPoints: [30, 0, 21],
        }),
      )

      expect(result).toEqual([
        Spells.ArcaneSubtletyRank2,
        Spells.FrostChannelingRank3,
      ])
    })

    it('infers Arcane Subtlety and Burning Soul when both conditions met', () => {
      const result = mageConfig.talentImplications!(
        createTalentContext({
          talentPoints: [21, 30, 0],
        }),
      )

      expect(result).toEqual([
        Spells.ArcaneSubtletyRank2,
        Spells.BurningSoulRank2,
      ])
    })

    it('prefers explicit Frost Channeling rank over tree inference', () => {
      const result = mageConfig.talentImplications!(
        createTalentContext({
          talentPoints: [10, 10, 31],
          talentRanks: new Map([[Spells.FrostChannelingRank1, 1]]),
        }),
      )

      expect(result).toEqual([Spells.FrostChannelingRank1])
    })

    it('returns no synthetic aura when tracked talents are absent', () => {
      const result = mageConfig.talentImplications!(
        createTalentContext({
          talentRanks: new Map([[999999, 3]]),
        }),
      )

      expect(result).toEqual([])
    })
  })
})
