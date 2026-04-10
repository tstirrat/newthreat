/**
 * Tests for TBC Hunter Threat Configuration.
 *
 * Interceptor behavior (charge tracking, AoE overflow, expiry) is covered in
 * shared/misdirection.test.ts. These tests focus on the hunter formula layer.
 */
import {
  createCastEvent,
  createDamageEvent,
  createMockActorContext,
} from '@wow-threat/shared'
import type { ThreatContext } from '@wow-threat/shared/src/types'
import { describe, expect, it } from 'vitest'

import { createCastContext } from '../../test/helpers/context'
import { Spells, hunterConfig } from './hunter'

function assertDefined<T>(value: T | undefined): T {
  expect(value).toBeDefined()
  if (value === undefined) {
    throw new Error('Expected value to be defined')
  }
  return value
}

function createMockContext(
  overrides: Partial<ThreatContext> = {},
): ThreatContext {
  return {
    event: createDamageEvent({ sourceID: 1, targetID: 2 }),
    amount: 100,
    spellSchoolMask: 0,
    sourceAuras: new Set(),
    targetAuras: new Set(),
    sourceActor: { id: 1, name: 'TestHunter', class: 'hunter' },
    targetActor: { id: 2, name: 'TestEnemy', class: null },
    encounterId: null,
    actors: createMockActorContext(),
    ...overrides,
  }
}

describe('tbc hunter config', () => {
  describe('distracting shot', () => {
    it('adds distracting shot rank 7', () => {
      const formula = hunterConfig.abilities[Spells.DistractingShotR7]!

      const result = assertDefined(
        formula?.(
          createCastContext({
            sourceID: 1,
            targetID: 10,
            abilityGameID: Spells.DistractingShotR7,
          }),
        ),
      )

      expect(result.spellModifier).toEqual({
        type: 'spell',
        bonus: 900,
      })
      expect(result.value).toBe(900)
    })
  })

  describe('misdirection', () => {
    it('installs an interceptor for redirect behavior', () => {
      const formula = hunterConfig.abilities[Spells.Misdirection]
      const result = assertDefined(
        formula?.(
          createMockContext({
            event: createCastEvent({
              sourceID: 1,
              targetID: 10,
              abilityGameID: Spells.Misdirection,
            }),
          }),
        ),
      )

      expect(result.note).toBe('misdirection(installInterceptor)')
      expect(result.value).toBe(0)
      expect(result.effects?.[0]?.type).toBe('installInterceptor')
    })
  })
})
