/**
 * Tests for the extendConfig utility.
 *
 * Verifies the three merge semantics:
 * - Scalar/function fields: extension wins, falls back to base when omitted.
 * - Record fields (abilities, auraModifiers, encounters): merged; ext wins on conflict.
 * - Set fields (aggroLossBuffs, fixateBuffs, invulnerabilityBuffs): union; base always included.
 */
import type {
  BaseThreatConfig,
  EncounterId,
  EncounterThreatConfig,
  SpellId,
  ThreatConfig,
} from '@wow-threat/shared'
import { describe, expect, it } from 'vitest'

import { extendConfig } from './extend-config'

// ============================================================================
// Test helpers
// ============================================================================

const spell = (id: number) => id as SpellId
const encounter = (id: number) => id as EncounterId

const stubFormula = () => undefined
const stubModifier = () => ({
  source: 'gear' as const,
  name: 'stub',
  value: 1.0,
})
const stubEncounter: EncounterThreatConfig = {}

const stubBaseThreat: BaseThreatConfig = {
  damage: stubFormula,
  absorbed: stubFormula,
  heal: stubFormula,
  energize: stubFormula,
}

/** Minimal ThreatConfig stub for merge tests. */
function makeBase(overrides: Partial<ThreatConfig> = {}): ThreatConfig {
  return {
    version: 1,
    displayName: 'Base',
    wowhead: { domain: 'classic' },
    resolve: () => false,
    baseThreat: stubBaseThreat,
    classes: {},
    auraModifiers: {},
    ...overrides,
  } as ThreatConfig
}

// ============================================================================
// Tests
// ============================================================================

describe('extendConfig', () => {
  describe('scalar / function fields', () => {
    it('always uses version from ext', () => {
      const result = extendConfig(makeBase({ version: 1 }), { version: 99 })
      expect(result.version).toBe(99)
    })

    it('uses ext displayName when provided', () => {
      const result = extendConfig(makeBase(), {
        version: 2,
        displayName: 'Custom',
      })
      expect(result.displayName).toBe('Custom')
    })

    it('falls back to base displayName when omitted from ext', () => {
      const result = extendConfig(makeBase({ displayName: 'Base' }), {
        version: 2,
      })
      expect(result.displayName).toBe('Base')
    })

    it('uses ext wowhead when provided', () => {
      const result = extendConfig(makeBase(), {
        version: 2,
        wowhead: { domain: 'tbc' },
      })
      expect(result.wowhead?.domain).toBe('tbc')
    })

    it('falls back to base wowhead when omitted from ext', () => {
      const base = makeBase({ wowhead: { domain: 'classic' } })
      const result = extendConfig(base, { version: 2 })
      expect(result.wowhead).toBe(base.wowhead)
    })

    it('uses ext resolve when provided', () => {
      const extResolve = () => true
      const result = extendConfig(makeBase(), {
        version: 2,
        resolve: extResolve,
      })
      expect(result.resolve).toBe(extResolve)
    })

    it('falls back to base resolve when omitted from ext', () => {
      const baseResolve = () => false
      const base = makeBase({ resolve: baseResolve })
      const result = extendConfig(base, { version: 2 })
      expect(result.resolve).toBe(baseResolve)
    })

    it('uses ext baseThreat when provided', () => {
      const extBaseThreat: BaseThreatConfig = {
        damage: stubFormula,
        absorbed: stubFormula,
        heal: stubFormula,
        energize: stubFormula,
      }
      const result = extendConfig(makeBase(), {
        version: 2,
        baseThreat: extBaseThreat,
      })
      expect(result.baseThreat).toBe(extBaseThreat)
    })

    it('falls back to base baseThreat when omitted from ext', () => {
      const base = makeBase({ baseThreat: stubBaseThreat })
      const result = extendConfig(base, { version: 2 })
      expect(result.baseThreat).toBe(stubBaseThreat)
    })

    it('uses ext gearImplications when provided', () => {
      const extGearImplications = () => [spell(100)]
      const result = extendConfig(makeBase(), {
        version: 2,
        gearImplications: extGearImplications,
      })
      expect(result.gearImplications).toBe(extGearImplications)
    })

    it('falls back to base gearImplications when omitted from ext', () => {
      const baseGearImplications = () => [spell(100)]
      const base = makeBase({ gearImplications: baseGearImplications })
      const result = extendConfig(base, { version: 2 })
      expect(result.gearImplications).toBe(baseGearImplications)
    })
  })

  describe('abilities (Record merge)', () => {
    it('inherits base abilities in the result', () => {
      const base = makeBase({ abilities: { [spell(1)]: stubFormula } })
      const result = extendConfig(base, { version: 2 })
      expect(result.abilities?.[spell(1)]).toBe(stubFormula)
    })

    it('adds ext abilities alongside base', () => {
      const extFormula = () => undefined
      const base = makeBase({ abilities: { [spell(1)]: stubFormula } })
      const result = extendConfig(base, {
        version: 2,
        abilities: { [spell(2)]: extFormula },
      })
      expect(result.abilities?.[spell(1)]).toBe(stubFormula)
      expect(result.abilities?.[spell(2)]).toBe(extFormula)
    })

    it('ext ability overrides base on conflict', () => {
      const extFormula = () => undefined
      const base = makeBase({ abilities: { [spell(1)]: stubFormula } })
      const result = extendConfig(base, {
        version: 2,
        abilities: { [spell(1)]: extFormula },
      })
      expect(result.abilities?.[spell(1)]).toBe(extFormula)
    })

    it('is undefined when neither base nor ext has abilities', () => {
      const result = extendConfig(makeBase(), { version: 2 })
      expect(result.abilities).toBeUndefined()
    })

    it('is defined when only base has abilities', () => {
      const base = makeBase({ abilities: { [spell(1)]: stubFormula } })
      const result = extendConfig(base, { version: 2 })
      expect(result.abilities).toBeDefined()
    })

    it('is defined when only ext has abilities', () => {
      const result = extendConfig(makeBase(), {
        version: 2,
        abilities: { [spell(1)]: stubFormula },
      })
      expect(result.abilities).toBeDefined()
    })
  })

  describe('auraModifiers (Record merge)', () => {
    it('inherits base auraModifiers in the result', () => {
      const base = makeBase({ auraModifiers: { [spell(100)]: stubModifier } })
      const result = extendConfig(base, { version: 2 })
      expect(result.auraModifiers[spell(100)]).toBe(stubModifier)
    })

    it('adds ext auraModifiers alongside base', () => {
      const extModifier = () => ({
        source: 'gear' as const,
        name: 'ext',
        value: 0.5,
      })
      const base = makeBase({ auraModifiers: { [spell(100)]: stubModifier } })
      const result = extendConfig(base, {
        version: 2,
        auraModifiers: { [spell(200)]: extModifier },
      })
      expect(result.auraModifiers[spell(100)]).toBe(stubModifier)
      expect(result.auraModifiers[spell(200)]).toBe(extModifier)
    })

    it('ext auraModifier overrides base on conflict', () => {
      const extModifier = () => ({
        source: 'gear' as const,
        name: 'ext',
        value: 0.5,
      })
      const base = makeBase({ auraModifiers: { [spell(100)]: stubModifier } })
      const result = extendConfig(base, {
        version: 2,
        auraModifiers: { [spell(100)]: extModifier },
      })
      expect(result.auraModifiers[spell(100)]).toBe(extModifier)
    })
  })

  describe('encounters (Record merge)', () => {
    it('inherits base encounters in the result', () => {
      const base = makeBase({
        encounters: { [encounter(791)]: stubEncounter },
      })
      const result = extendConfig(base, { version: 2 })
      expect(result.encounters?.[encounter(791)]).toBe(stubEncounter)
    })

    it('adds ext encounters alongside base', () => {
      const extEncounter: EncounterThreatConfig = {}
      const base = makeBase({
        encounters: { [encounter(791)]: stubEncounter },
      })
      const result = extendConfig(base, {
        version: 2,
        encounters: { [encounter(999)]: extEncounter },
      })
      expect(result.encounters?.[encounter(791)]).toBe(stubEncounter)
      expect(result.encounters?.[encounter(999)]).toBe(extEncounter)
    })

    it('is undefined when neither base nor ext has encounters', () => {
      const result = extendConfig(makeBase(), { version: 2 })
      expect(result.encounters).toBeUndefined()
    })
  })

  describe('Set fields (aggroLossBuffs, fixateBuffs, invulnerabilityBuffs)', () => {
    it('unions aggroLossBuffs from base and ext', () => {
      const base = makeBase({ aggroLossBuffs: new Set([spell(10)]) })
      const result = extendConfig(base, {
        version: 2,
        aggroLossBuffs: [spell(20)],
      })
      expect(result.aggroLossBuffs?.has(spell(10))).toBe(true)
      expect(result.aggroLossBuffs?.has(spell(20))).toBe(true)
    })

    it('always includes base aggroLossBuffs even when ext omits them', () => {
      const base = makeBase({ aggroLossBuffs: new Set([spell(10)]) })
      const result = extendConfig(base, { version: 2 })
      expect(result.aggroLossBuffs?.has(spell(10))).toBe(true)
    })

    it('unions fixateBuffs from base and ext', () => {
      const base = makeBase({ fixateBuffs: new Set([spell(10)]) })
      const result = extendConfig(base, {
        version: 2,
        fixateBuffs: [spell(20)],
      })
      expect(result.fixateBuffs?.has(spell(10))).toBe(true)
      expect(result.fixateBuffs?.has(spell(20))).toBe(true)
    })

    it('always includes base fixateBuffs even when ext omits them', () => {
      const base = makeBase({ fixateBuffs: new Set([spell(10)]) })
      const result = extendConfig(base, { version: 2 })
      expect(result.fixateBuffs?.has(spell(10))).toBe(true)
    })

    it('unions invulnerabilityBuffs from base and ext', () => {
      const base = makeBase({ invulnerabilityBuffs: new Set([spell(10)]) })
      const result = extendConfig(base, {
        version: 2,
        invulnerabilityBuffs: [spell(20)],
      })
      expect(result.invulnerabilityBuffs?.has(spell(10))).toBe(true)
      expect(result.invulnerabilityBuffs?.has(spell(20))).toBe(true)
    })

    it('always includes base invulnerabilityBuffs even when ext omits them', () => {
      const base = makeBase({ invulnerabilityBuffs: new Set([spell(10)]) })
      const result = extendConfig(base, { version: 2 })
      expect(result.invulnerabilityBuffs?.has(spell(10))).toBe(true)
    })
  })
})
