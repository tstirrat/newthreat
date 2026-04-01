/**
 * Tests for insignificant-enemy-filter processor.
 */
import type { Enemy } from '@wow-threat/shared'
import { HitTypeCode } from '@wow-threat/wcl-types'
import { describe, expect, it } from 'vitest'

import {
  type ProcessorBaseContext,
  createProcessorNamespace,
  runFightPrepass,
} from '../event-processors'
import { createMockThreatConfig } from '../test/helpers/config'
import {
  createInsignificantEnemyFilterProcessor,
  significantEnemyIdsKey,
} from './insignificant-enemy-filter'

function createEnemy(id: number, name: string): Enemy {
  return { id, name, instance: 0 }
}

function createBaseContext(
  enemies: Enemy[],
  friendlyActorIds?: Set<number>,
): ProcessorBaseContext {
  return {
    namespace: createProcessorNamespace(),
    actorMap: new Map(),
    friendlyActorIds,
    enemies,
    encounterId: null,
    config: createMockThreatConfig(),
    report: null,
    fight: null,
    inferThreatReduction: false,
    initialAurasByActor: new Map(),
  }
}

function makeProcessor() {
  const factory = createInsignificantEnemyFilterProcessor
  return factory({ report: null, fight: null, inferThreatReduction: false })!
}

function makeDamageEvent(sourceID: number, targetID: number, timestamp = 1000) {
  return {
    type: 'damage' as const,
    timestamp,
    sourceID,
    targetID,
    abilityGameID: 1,
    amount: 100,
    absorbed: 0,
    blocked: 0,
    mitigated: 0,
    overkill: 0,
    hitType: HitTypeCode.Hit,
    tick: false,
    multistrike: false,
  }
}

function makeBuffEvent(sourceID: number, targetID: number, timestamp = 1000) {
  return {
    type: 'applybuff' as const,
    timestamp,
    sourceID,
    targetID,
    abilityGameID: 100,
  }
}

describe('createInsignificantEnemyFilterProcessor', () => {
  it('does not mark an enemy as significant when it damages a player but no player targets it', () => {
    const boss = createEnemy(99, 'Boss')
    const player = 1
    const enemies = [boss]
    const friendlyActorIds = new Set([player])
    const ctx = createBaseContext(enemies, friendlyActorIds)
    const processor = makeProcessor()

    // Enemy damages player but player never retaliates — environmental NPC pattern
    runFightPrepass({
      rawEvents: [makeDamageEvent(boss.id, player)],
      processors: [processor],
      baseContext: ctx,
    })

    const result = ctx.namespace.get(significantEnemyIdsKey)
    expect(result?.has(boss.id)).toBe(false)
  })

  it('marks an enemy that only self-buffs as insignificant', () => {
    const add = createEnemy(100, 'Insignificant Add')
    const enemies = [add]
    const friendlyActorIds = new Set([1])
    const ctx = createBaseContext(enemies, friendlyActorIds)
    const processor = makeProcessor()

    // Enemy only casts on itself
    runFightPrepass({
      rawEvents: [makeBuffEvent(add.id, add.id)],
      processors: [processor],
      baseContext: ctx,
    })

    const result = ctx.namespace.get(significantEnemyIdsKey)
    expect(result?.has(add.id)).toBe(false)
  })

  it('marks an enemy never targeted by any player as insignificant', () => {
    const add = createEnemy(100, 'Ignored Add')
    const enemies = [add]
    const friendlyActorIds = new Set([1, 2])
    const ctx = createBaseContext(enemies, friendlyActorIds)
    const processor = makeProcessor()

    // Players interact with each other, never with the add
    runFightPrepass({
      rawEvents: [makeDamageEvent(1, 2), makeBuffEvent(2, 1)],
      processors: [processor],
      baseContext: ctx,
    })

    const result = ctx.namespace.get(significantEnemyIdsKey)
    expect(result?.has(add.id)).toBe(false)
  })

  it('marks an enemy targeted by a player attack as significant', () => {
    const boss = createEnemy(99, 'Boss')
    const player = 1
    const enemies = [boss]
    const friendlyActorIds = new Set([player])
    const ctx = createBaseContext(enemies, friendlyActorIds)
    const processor = makeProcessor()

    // Player damages the enemy
    runFightPrepass({
      rawEvents: [makeDamageEvent(player, boss.id)],
      processors: [processor],
      baseContext: ctx,
    })

    const result = ctx.namespace.get(significantEnemyIdsKey)
    expect(result?.has(boss.id)).toBe(true)
  })

  it('marks an enemy that only casts on other enemies as insignificant', () => {
    const boss = createEnemy(99, 'Boss')
    const add = createEnemy(100, 'Minion')
    const player = 1
    const enemies = [boss, add]
    const friendlyActorIds = new Set([player])
    const ctx = createBaseContext(enemies, friendlyActorIds)
    const processor = makeProcessor()

    // Player attacks boss (significant), add only casts on boss (insignificant)
    runFightPrepass({
      rawEvents: [
        makeDamageEvent(player, boss.id),
        makeBuffEvent(add.id, boss.id),
      ],
      processors: [processor],
      baseContext: ctx,
    })

    const result = ctx.namespace.get(significantEnemyIdsKey)
    expect(result?.has(boss.id)).toBe(true)
    expect(result?.has(add.id)).toBe(false)
  })

  it('correctly filters mixed significant and insignificant enemies', () => {
    const boss = createEnemy(99, 'Boss')
    const significantAdd = createEnemy(100, 'Tank Add')
    const insignificantAdd = createEnemy(101, 'Decoration Add')
    const player = 1
    const enemies = [boss, significantAdd, insignificantAdd]
    const friendlyActorIds = new Set([player])
    const ctx = createBaseContext(enemies, friendlyActorIds)
    const processor = makeProcessor()

    runFightPrepass({
      rawEvents: [
        makeDamageEvent(player, boss.id),
        makeDamageEvent(player, significantAdd.id),
        // insignificantAdd never interacts with players
        makeBuffEvent(insignificantAdd.id, insignificantAdd.id),
      ],
      processors: [processor],
      baseContext: ctx,
    })

    const result = ctx.namespace.get(significantEnemyIdsKey)
    expect(result?.has(boss.id)).toBe(true)
    expect(result?.has(significantAdd.id)).toBe(true)
    expect(result?.has(insignificantAdd.id)).toBe(false)
  })

  it('produces empty significant set when all enemies are insignificant', () => {
    const add1 = createEnemy(100, 'Vortex 1')
    const add2 = createEnemy(101, 'Vortex 2')
    const enemies = [add1, add2]
    const friendlyActorIds = new Set([1])
    const ctx = createBaseContext(enemies, friendlyActorIds)
    const processor = makeProcessor()

    // Adds only interact with each other
    runFightPrepass({
      rawEvents: [
        makeBuffEvent(add1.id, add2.id),
        makeBuffEvent(add2.id, add1.id),
      ],
      processors: [processor],
      baseContext: ctx,
    })

    const result = ctx.namespace.get(significantEnemyIdsKey)
    expect(result).toBeDefined()
    expect(result!.size).toBe(0)
  })

  it('stores significantEnemyIdsKey even when no events are processed', () => {
    const boss = createEnemy(99, 'Boss')
    const enemies = [boss]
    const friendlyActorIds = new Set([1])
    const ctx = createBaseContext(enemies, friendlyActorIds)
    const processor = makeProcessor()

    runFightPrepass({
      rawEvents: [],
      processors: [processor],
      baseContext: ctx,
    })

    // Key should be present (empty set) — consumers can rely on it existing
    expect(ctx.namespace.has(significantEnemyIdsKey)).toBe(true)
    expect(ctx.namespace.get(significantEnemyIdsKey)!.size).toBe(0)
  })

  it('works correctly when friendlyActorIds is undefined', () => {
    const boss = createEnemy(99, 'Boss')
    const enemies = [boss]
    // No friendlyActorIds — no player interactions possible
    const ctx = createBaseContext(enemies, undefined)
    const processor = makeProcessor()

    runFightPrepass({
      rawEvents: [makeDamageEvent(boss.id, 1)],
      processors: [processor],
      baseContext: ctx,
    })

    const result = ctx.namespace.get(significantEnemyIdsKey)
    // Without friendlyActorIds all targets appear non-friendly → enemy is insignificant
    expect(result?.has(boss.id)).toBe(false)
  })
})
