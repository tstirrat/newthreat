/**
 * Tests for the shared Misdirection interceptor helper.
 *
 * These tests exercise createMisdirectionInterceptor directly,
 * covering charge tracking, AoE overflow windows, expiry, and dead-target behavior.
 */
import {
  createDamageEvent,
  createHealEvent,
  createMockActorContext,
} from '@wow-threat/shared'
import type { EventInterceptorContext } from '@wow-threat/shared/src/types'
import { describe, expect, it, vi } from 'vitest'

import { createMisdirectionInterceptor } from './misdirection'

// ============================================================================
// Test helpers
// ============================================================================

const HunterSpells = {
  AutoShot: 75,
  MultiShot: 2643,
  SerpentSting: 1978,
  ExplosiveTrapEffect: 13812,
} as const

const HUNTER_ID = 1
const ALLY_TARGET_ID = 10

function createMockInterceptorCtx(
  actors: ReturnType<typeof createMockActorContext>,
  overrides: Partial<EventInterceptorContext> = {},
): EventInterceptorContext {
  return {
    timestamp: 2000,
    installedAt: 1000,
    actors,
    uninstall: vi.fn(),
    setAura: () => {},
    removeAura: () => {},
    ...overrides,
  }
}

function createInterceptor(
  options: {
    hunterId?: number
    targetId?: number
    actors?: ReturnType<typeof createMockActorContext>
  } = {},
) {
  const hunterId = options.hunterId ?? HUNTER_ID
  const targetId = options.targetId ?? ALLY_TARGET_ID
  const actors = options.actors ?? createMockActorContext()
  return {
    interceptor: createMisdirectionInterceptor(hunterId, targetId),
    actors,
    targetId,
    hunterId,
  }
}

// ============================================================================
// Tests
// ============================================================================

describe('createMisdirectionInterceptor', () => {
  it('returns passthrough for non-damage events', () => {
    const { interceptor, actors } = createInterceptor()
    const ctx = createMockInterceptorCtx(actors)

    const result = interceptor(
      createHealEvent({ sourceID: HUNTER_ID, targetID: 2 }),
      ctx,
    )

    expect(result).toEqual({ action: 'passthrough' })
  })

  it('redirects direct hunter damage to the ally target', () => {
    const { interceptor, actors } = createInterceptor()
    const ctx = createMockInterceptorCtx(actors)

    const result = interceptor(
      createDamageEvent({
        sourceID: HUNTER_ID,
        targetID: 2,
        abilityGameID: HunterSpells.AutoShot,
        tick: false,
      }),
      ctx,
    )

    expect(result).toEqual({
      action: 'augment',
      threatRecipientOverride: ALLY_TARGET_ID,
    })
  })

  it('ignores damage from other sources', () => {
    const { interceptor, actors } = createInterceptor({ hunterId: 1 })
    const ctx = createMockInterceptorCtx(actors)

    const result = interceptor(
      createDamageEvent({
        sourceID: 5,
        targetID: 2,
        abilityGameID: HunterSpells.AutoShot,
        tick: false,
      }),
      ctx,
    )

    expect(result).toEqual({ action: 'passthrough' })
    expect(ctx.uninstall).not.toHaveBeenCalled()
  })

  it('does not redirect when the ally target is dead, but still consumes charges', () => {
    const actors = createMockActorContext({ isActorAlive: () => false })
    const { interceptor } = createInterceptor({ actors })
    const uninstall = vi.fn()
    const ctx = createMockInterceptorCtx(actors, { uninstall })

    const damageEvent = createDamageEvent({
      sourceID: HUNTER_ID,
      targetID: 2,
      abilityGameID: HunterSpells.AutoShot,
      tick: false,
    })

    expect(interceptor(damageEvent, ctx)).toEqual({ action: 'passthrough' })
    expect(interceptor(damageEvent, ctx)).toEqual({ action: 'passthrough' })
    expect(uninstall).not.toHaveBeenCalled()

    expect(interceptor(damageEvent, ctx)).toEqual({ action: 'passthrough' })
    expect(uninstall).toHaveBeenCalledTimes(1)
  })

  it('expires after 30 seconds', () => {
    const { interceptor, actors } = createInterceptor()
    const uninstall = vi.fn()

    const withinCtx = createMockInterceptorCtx(actors, {
      timestamp: 20000,
      installedAt: 1000,
      uninstall,
    })
    const withinResult = interceptor(
      createDamageEvent({
        sourceID: HUNTER_ID,
        targetID: 2,
        abilityGameID: HunterSpells.AutoShot,
        tick: false,
      }),
      withinCtx,
    )
    expect(withinResult).toEqual({
      action: 'augment',
      threatRecipientOverride: ALLY_TARGET_ID,
    })
    expect(uninstall).not.toHaveBeenCalled()

    const afterCtx = createMockInterceptorCtx(actors, {
      timestamp: 32000,
      installedAt: 1000,
      uninstall,
    })
    const afterResult = interceptor(
      createDamageEvent({
        sourceID: HUNTER_ID,
        targetID: 2,
        abilityGameID: HunterSpells.AutoShot,
        tick: false,
      }),
      afterCtx,
    )
    expect(afterResult).toEqual({ action: 'passthrough' })
    expect(uninstall).toHaveBeenCalledTimes(1)
  })

  it('does not consume charges on periodic damage (e.g. serpent sting ticks)', () => {
    const { interceptor, actors } = createInterceptor()
    const uninstall = vi.fn()
    const ctx = createMockInterceptorCtx(actors, { uninstall })

    const periodicTick = createDamageEvent({
      sourceID: HUNTER_ID,
      targetID: 2,
      abilityGameID: HunterSpells.SerpentSting,
      tick: true,
    })
    expect(interceptor(periodicTick, ctx)).toEqual({ action: 'passthrough' })
    expect(uninstall).not.toHaveBeenCalled()

    const directHit = createDamageEvent({
      sourceID: HUNTER_ID,
      targetID: 2,
      abilityGameID: HunterSpells.AutoShot,
      tick: false,
    })
    expect(interceptor(directHit, ctx)).toEqual({
      action: 'augment',
      threatRecipientOverride: ALLY_TARGET_ID,
    })
    expect(interceptor(directHit, ctx)).toEqual({
      action: 'augment',
      threatRecipientOverride: ALLY_TARGET_ID,
    })
    expect(uninstall).not.toHaveBeenCalled()

    expect(interceptor(directHit, ctx)).toEqual({
      action: 'augment',
      threatRecipientOverride: ALLY_TARGET_ID,
    })
    expect(uninstall).toHaveBeenCalledTimes(1)
  })

  it('consumes all 3 charges when multi-shot lands on 3 targets', () => {
    const { interceptor, actors } = createInterceptor()
    const uninstall = vi.fn()
    const ctx = createMockInterceptorCtx(actors, { uninstall })

    const results = [2, 3, 4].map((targetID) =>
      interceptor(
        createDamageEvent({
          sourceID: HUNTER_ID,
          targetID,
          abilityGameID: HunterSpells.MultiShot,
          tick: false,
        }),
        ctx,
      ),
    )

    expect(results).toEqual([
      { action: 'augment', threatRecipientOverride: ALLY_TARGET_ID },
      { action: 'augment', threatRecipientOverride: ALLY_TARGET_ID },
      { action: 'augment', threatRecipientOverride: ALLY_TARGET_ID },
    ])
    expect(uninstall).toHaveBeenCalledTimes(1)
  })

  it('retains remaining charges when multi-shot only hits 2 targets', () => {
    const { interceptor, actors } = createInterceptor()
    const uninstall = vi.fn()
    const ctx = createMockInterceptorCtx(actors, { uninstall })

    const firstHit = interceptor(
      createDamageEvent({
        sourceID: HUNTER_ID,
        targetID: 2,
        abilityGameID: HunterSpells.MultiShot,
        tick: false,
      }),
      ctx,
    )
    const secondHit = interceptor(
      createDamageEvent({
        sourceID: HUNTER_ID,
        targetID: 3,
        abilityGameID: HunterSpells.MultiShot,
        tick: false,
      }),
      ctx,
    )

    expect(firstHit).toEqual({
      action: 'augment',
      threatRecipientOverride: ALLY_TARGET_ID,
    })
    expect(secondHit).toEqual({
      action: 'augment',
      threatRecipientOverride: ALLY_TARGET_ID,
    })
    expect(uninstall).not.toHaveBeenCalled()

    const thirdHit = interceptor(
      createDamageEvent({
        sourceID: HUNTER_ID,
        targetID: 4,
        abilityGameID: HunterSpells.AutoShot,
        tick: false,
      }),
      ctx,
    )
    expect(thirdHit).toEqual({
      action: 'augment',
      threatRecipientOverride: ALLY_TARGET_ID,
    })
    expect(uninstall).toHaveBeenCalledTimes(1)
  })

  it('redirects all explosive trap AoE hits in a single timestamp, even beyond 3 targets', () => {
    const { interceptor, actors } = createInterceptor()
    const uninstall = vi.fn()
    const ctx = createMockInterceptorCtx(actors, { uninstall })

    const initialHits = [2, 3, 4, 5, 6].map((targetID) =>
      interceptor(
        createDamageEvent({
          timestamp: 5000,
          sourceID: HUNTER_ID,
          targetID,
          abilityGameID: HunterSpells.ExplosiveTrapEffect,
          tick: false,
        }),
        ctx,
      ),
    )

    expect(initialHits).toEqual([
      { action: 'augment', threatRecipientOverride: ALLY_TARGET_ID },
      { action: 'augment', threatRecipientOverride: ALLY_TARGET_ID },
      { action: 'augment', threatRecipientOverride: ALLY_TARGET_ID },
      { action: 'augment', threatRecipientOverride: ALLY_TARGET_ID },
      { action: 'augment', threatRecipientOverride: ALLY_TARGET_ID },
    ])
    expect(uninstall).not.toHaveBeenCalled()

    const postWindowEvent = interceptor(
      createDamageEvent({
        timestamp: 5001,
        sourceID: HUNTER_ID,
        targetID: 2,
        abilityGameID: HunterSpells.AutoShot,
        tick: false,
      }),
      ctx,
    )
    expect(postWindowEvent).toEqual({ action: 'passthrough' })
    expect(uninstall).toHaveBeenCalledTimes(1)
  })
})
