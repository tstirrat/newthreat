/**
 * Tests for TBC Mage Threat Configuration - Invisibility interceptor
 */
import {
  createApplyBuffEvent,
  createDamageEvent,
  createMockActorContext,
  createRemoveBuffEvent,
} from '@wow-threat/shared'
import type {
  EventInterceptor,
  EventInterceptorContext,
  ThreatContext,
} from '@wow-threat/shared/src/types'
import { describe, expect, it, vi } from 'vitest'

import { Spells, createInvisibilityInterceptor, mageConfig } from './mage'

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
    event: createApplyBuffEvent({
      sourceID: 1,
      targetID: 1,
      abilityGameID: Spells.Invisibility,
    }),
    amount: 0,
    spellSchoolMask: 0,
    sourceAuras: new Set(),
    targetAuras: new Set(),
    sourceActor: { id: 1, name: 'TestMage', class: 'mage' },
    targetActor: { id: 1, name: 'TestMage', class: 'mage' },
    encounterId: null,
    actors: createMockActorContext(),
    ...overrides,
  }
}

function createMockInterceptorContext(
  overrides: Partial<EventInterceptorContext> = {},
): EventInterceptorContext {
  return {
    timestamp: 2000,
    installedAt: 1000,
    actors: createMockActorContext(),
    uninstall: vi.fn(),
    setAura: () => {},
    removeAura: () => {},
    ...overrides,
  }
}

function createInvisibilityHandler(sourceActorId = 1): EventInterceptor {
  const formula = assertDefined(mageConfig.abilities?.[Spells.Invisibility])
  const result = assertDefined(
    formula(
      createMockContext({
        event: createApplyBuffEvent({
          sourceID: sourceActorId,
          targetID: sourceActorId,
          abilityGameID: Spells.Invisibility,
        }),
        sourceActor: { id: sourceActorId, name: 'TestMage', class: 'mage' },
      }),
    ),
  )

  if (result.effects?.[1]?.type !== 'installInterceptor') {
    throw new Error('Expected installInterceptor effect at index 1')
  }

  return result.effects[1].interceptor
}

describe('tbc mage config', () => {
  describe('invisibility applybuff', () => {
    it('returns modifyThreat(0.8, all) and installInterceptor effects', () => {
      const formula = assertDefined(mageConfig.abilities?.[Spells.Invisibility])
      const result = assertDefined(formula(createMockContext()))

      expect(result.value).toBe(0)
      expect(result.splitAmongEnemies).toBe(false)
      expect(result.note).toBe('invisibility(applybuff)')
      expect(result.effects).toHaveLength(2)
      expect(result.effects?.[0]).toEqual({
        type: 'modifyThreat',
        multiplier: 0.8,
        target: 'all',
      })
      expect(result.effects?.[1]?.type).toBe('installInterceptor')
    })

    it('returns undefined for non-applybuff events', () => {
      const formula = assertDefined(mageConfig.abilities?.[Spells.Invisibility])
      const result = formula(
        createMockContext({
          event: createRemoveBuffEvent({
            sourceID: 1,
            targetID: 1,
            abilityGameID: Spells.Invisibility,
          }),
        }),
      )

      expect(result).toBeUndefined()
    })
  })

  describe('invisibility interceptor', () => {
    it('returns correctionMultiplier 1.0 after 1 second', () => {
      const handler = createInvisibilityHandler()
      const uninstall = vi.fn()
      const ctx = createMockInterceptorContext({
        installedAt: 1000,
        timestamp: 2000, // 1 second later
        uninstall,
      })

      const result = handler(
        createRemoveBuffEvent({
          sourceID: 1,
          targetID: 1,
          abilityGameID: Spells.Invisibility,
        }),
        ctx,
      )

      // nbSeconds=1, targetMultiplier=max(0, 1-0.2)=0.8, correctionMultiplier=0.8/0.8=1.0
      expect(result).toEqual({
        action: 'augment',
        effects: [{ type: 'modifyThreat', multiplier: 1.0, target: 'all' }],
      })
      expect(uninstall).toHaveBeenCalledTimes(1)
    })

    it('returns correctionMultiplier 0.75 after 2 seconds', () => {
      const handler = createInvisibilityHandler()
      const uninstall = vi.fn()
      const ctx = createMockInterceptorContext({
        installedAt: 1000,
        timestamp: 3000, // 2 seconds later
        uninstall,
      })

      const result = handler(
        createRemoveBuffEvent({
          sourceID: 1,
          targetID: 1,
          abilityGameID: Spells.Invisibility,
        }),
        ctx,
      )

      // nbSeconds=2, targetMultiplier=max(0, 1-0.4)=0.6, correctionMultiplier=0.6/0.8=0.75
      expect(result).toEqual({
        action: 'augment',
        effects: [
          {
            type: 'modifyThreat',
            multiplier: expect.closeTo(0.75),
            target: 'all',
          },
        ],
      })
      expect(uninstall).toHaveBeenCalledTimes(1)
    })

    it('returns correctionMultiplier 0.0 after 5 seconds', () => {
      const handler = createInvisibilityHandler()
      const uninstall = vi.fn()
      const ctx = createMockInterceptorContext({
        installedAt: 1000,
        timestamp: 6000, // 5 seconds later
        uninstall,
      })

      const result = handler(
        createRemoveBuffEvent({
          sourceID: 1,
          targetID: 1,
          abilityGameID: Spells.Invisibility,
        }),
        ctx,
      )

      // nbSeconds=5, targetMultiplier=max(0, 1-1.0)=0.0, correctionMultiplier=0.0/0.8=0.0
      expect(result).toEqual({
        action: 'augment',
        effects: [{ type: 'modifyThreat', multiplier: 0, target: 'all' }],
      })
      expect(uninstall).toHaveBeenCalledTimes(1)
    })

    it('returns passthrough for removebuff of a different spell', () => {
      const handler = createInvisibilityHandler()
      const uninstall = vi.fn()
      const ctx = createMockInterceptorContext({ uninstall })

      const result = handler(
        createRemoveBuffEvent({
          sourceID: 1,
          targetID: 1,
          abilityGameID: 9999,
        }),
        ctx,
      )

      expect(result).toEqual({ action: 'passthrough' })
      expect(uninstall).not.toHaveBeenCalled()
    })

    it('returns passthrough for removebuff from a different sourceID', () => {
      const handler = createInvisibilityHandler(1)
      const uninstall = vi.fn()
      const ctx = createMockInterceptorContext({ uninstall })

      const result = handler(
        createRemoveBuffEvent({
          sourceID: 5,
          targetID: 5,
          abilityGameID: Spells.Invisibility,
        }),
        ctx,
      )

      expect(result).toEqual({ action: 'passthrough' })
      expect(uninstall).not.toHaveBeenCalled()
    })

    it('returns passthrough for non-removebuff events', () => {
      const handler = createInvisibilityHandler()
      const uninstall = vi.fn()
      const ctx = createMockInterceptorContext({ uninstall })

      const result = handler(
        createDamageEvent({
          sourceID: 1,
          targetID: 2,
          abilityGameID: Spells.Invisibility,
        }),
        ctx,
      )

      expect(result).toEqual({ action: 'passthrough' })
      expect(uninstall).not.toHaveBeenCalled()
    })
  })

  describe('createInvisibilityInterceptor', () => {
    it('returns passthrough for non-removebuff events', () => {
      const handler = createInvisibilityInterceptor(1, Spells.Invisibility)
      const ctx = createMockInterceptorContext()

      const result = handler(
        createDamageEvent({
          sourceID: 1,
          targetID: 2,
        }),
        ctx,
      )

      expect(result).toEqual({ action: 'passthrough' })
    })
  })
})
