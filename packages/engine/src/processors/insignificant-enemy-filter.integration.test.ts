/**
 * Integration tests for the insignificant-enemy filter across realistic encounter scenarios.
 *
 * Tests cover three fight types where insignificant enemies are present:
 * - Gothik the Harvester: non-character adds that don't interact with players
 * - Sapphiron: Blizzard add spawns that deal AoE damage to players but are never targeted
 * - Ossirian the Unscarred: Wind Vortexes that never target players
 *
 * Each scenario verifies that split threat (heal/AoE) is distributed only
 * among significant enemies, while direct-target threat is unaffected.
 */
import type { Actor, Enemy, ThreatContext } from '@wow-threat/shared'
import { HitTypeCode } from '@wow-threat/wcl-types'
import { describe, expect, it } from 'vitest'

import { createMockThreatConfig } from '../test/helpers/config'
import { processEvents } from '../threat-engine'

// ─── shared helpers ───────────────────────────────────────────────────────────

function makeEnemy(id: number, name: string): Enemy {
  return { id, name, instance: 0 }
}

function makeActor(id: number, name: string): Actor {
  return { id, name, class: 'warrior' }
}

/** Config where heals produce split threat and damage produces direct threat */
const splitThreatConfig = createMockThreatConfig({
  baseThreat: {
    damage: (ctx: ThreatContext) => ({
      value: ctx.amount,
      splitAmongEnemies: false,
    }),
    absorbed: (ctx: ThreatContext) => ({
      value: ctx.amount,
      splitAmongEnemies: false,
    }),
    heal: (ctx: ThreatContext) => ({
      value: ctx.amount,
      splitAmongEnemies: true,
    }),
    energize: (ctx: ThreatContext) => ({
      value: ctx.amount,
      splitAmongEnemies: false,
    }),
  },
})

function makeDamageEvent(
  sourceID: number,
  targetID: number,
  amount = 100,
  timestamp = 1000,
) {
  return {
    type: 'damage' as const,
    timestamp,
    sourceID,
    targetID,
    abilityGameID: 1,
    amount,
    absorbed: 0,
    blocked: 0,
    mitigated: 0,
    overkill: 0,
    hitType: HitTypeCode.Hit,
    tick: false,
    multistrike: false,
  }
}

function makeHealEvent(
  sourceID: number,
  targetID: number,
  amount = 100,
  timestamp = 1000,
) {
  return {
    type: 'heal' as const,
    timestamp,
    sourceID,
    targetID,
    abilityGameID: 2,
    amount,
    absorbed: 0,
    overheal: 0,
    tick: false,
    multistrike: false,
  }
}

function makeBuffEvent(sourceID: number, targetID: number, timestamp = 900) {
  return {
    type: 'applybuff' as const,
    timestamp,
    sourceID,
    targetID,
    abilityGameID: 10,
  }
}

function getThreatForActor(
  result: ReturnType<typeof processEvents>,
  actorId: number,
  enemyId: number,
): number {
  const changes = result.augmentedEvents.flatMap((e) => e.threat?.changes ?? [])
  return changes
    .filter((c) => c.sourceId === actorId && c.targetId === enemyId)
    .reduce((sum, c) => sum + c.amount, 0)
}

// ─── Gothik the Harvester scenario ────────────────────────────────────────────

describe('Gothik the Harvester — non-character adds excluded from split threat', () => {
  const tank = makeActor(1, 'Tank')
  const healer = makeActor(2, 'Healer')
  const gothik = makeEnemy(16060, 'Gothik the Harvester')
  // Death Knight Understudy adds — non-character, never interact with players
  const dkUnderstudy1 = makeEnemy(16064, 'Death Knight Understudy 1')
  const dkUnderstudy2 = makeEnemy(16064, 'Death Knight Understudy 2') // same NPC id, different instance
  Object.assign(dkUnderstudy2, { instance: 1 })

  const enemies = [gothik, dkUnderstudy1, dkUnderstudy2]
  const actorMap = new Map<number, Actor>([
    [tank.id, tank],
    [healer.id, healer],
  ])
  const friendlyActorIds = new Set([tank.id, healer.id])

  it('splits heal threat only among Gothik when adds never interact with players', () => {
    const events = [
      // Prepass: Gothik hits the tank
      makeDamageEvent(gothik.id, tank.id, 200, 100),
      // Prepass: adds only self-cast (insignificant)
      makeBuffEvent(dkUnderstudy1.id, dkUnderstudy1.id, 100),
      makeBuffEvent(dkUnderstudy2.id, dkUnderstudy2.id, 100),
      // Tank hits Gothik (direct threat)
      makeDamageEvent(tank.id, gothik.id, 300, 1000),
      // Healer heals tank (split threat — should go to Gothik only)
      makeHealEvent(healer.id, tank.id, 600, 2000),
    ]

    const result = processEvents({
      rawEvents: events,
      actorMap,
      friendlyActorIds,
      enemies,
      config: splitThreatConfig,
    })

    const healerThreatOnGothik = getThreatForActor(result, healer.id, gothik.id)
    const healerThreatOnAdd1 = getThreatForActor(
      result,
      healer.id,
      dkUnderstudy1.id,
    )
    const healerThreatOnAdd2 = getThreatForActor(
      result,
      healer.id,
      dkUnderstudy2.id,
    )

    // Healer's 600 heal goes entirely to Gothik (not split 3 ways)
    expect(healerThreatOnGothik).toBe(600)
    expect(healerThreatOnAdd1).toBe(0)
    expect(healerThreatOnAdd2).toBe(0)
  })

  it('applies direct-target damage threat to Gothik regardless of filter', () => {
    const events = [
      makeDamageEvent(gothik.id, tank.id, 200, 100),
      makeBuffEvent(dkUnderstudy1.id, dkUnderstudy1.id, 100),
      makeDamageEvent(tank.id, gothik.id, 400, 1000),
    ]

    const result = processEvents({
      rawEvents: events,
      actorMap,
      friendlyActorIds,
      enemies,
      config: splitThreatConfig,
    })

    const tankThreatOnGothik = getThreatForActor(result, tank.id, gothik.id)
    expect(tankThreatOnGothik).toBe(400)
  })
})

// ─── Sapphiron scenario ───────────────────────────────────────────────────────

describe('Sapphiron — Blizzard add spawns excluded from split threat', () => {
  const tank = makeActor(1, 'Tank')
  const healer = makeActor(2, 'Healer')
  const sapphiron = makeEnemy(15989, 'Sapphiron')
  // Blizzard adds spawned during the fight — they deal AoE damage to players but are never targeted
  const blizzardAdd1 = makeEnemy(16474, 'Blizzard 1')
  const blizzardAdd2 = makeEnemy(16474, 'Blizzard 2')
  Object.assign(blizzardAdd2, { instance: 1 })

  const enemies = [sapphiron, blizzardAdd1, blizzardAdd2]
  const actorMap = new Map<number, Actor>([
    [tank.id, tank],
    [healer.id, healer],
  ])
  const friendlyActorIds = new Set([tank.id, healer.id])

  it('splits heal threat only among Sapphiron when Blizzard adds damage players but are never targeted', () => {
    const events = [
      // Prepass: Sapphiron attacks tank
      makeDamageEvent(sapphiron.id, tank.id, 500, 100),
      // Prepass: Blizzard adds deal AoE frost damage to players (real WCL data)
      // but no player ever targets them — they remain insignificant
      makeDamageEvent(blizzardAdd1.id, tank.id, 150, 150),
      makeDamageEvent(blizzardAdd2.id, healer.id, 150, 150),
      makeBuffEvent(blizzardAdd1.id, blizzardAdd1.id, 100),
      makeBuffEvent(blizzardAdd2.id, blizzardAdd2.id, 100),
      // Tank attacks Sapphiron only
      makeDamageEvent(tank.id, sapphiron.id, 200, 1000),
      // Healer heals — should split only to Sapphiron
      makeHealEvent(healer.id, tank.id, 900, 2000),
    ]

    const result = processEvents({
      rawEvents: events,
      actorMap,
      friendlyActorIds,
      enemies,
      config: splitThreatConfig,
    })

    const healerThreatOnSapphiron = getThreatForActor(
      result,
      healer.id,
      sapphiron.id,
    )
    const healerThreatOnBlizzard1 = getThreatForActor(
      result,
      healer.id,
      blizzardAdd1.id,
    )
    const healerThreatOnBlizzard2 = getThreatForActor(
      result,
      healer.id,
      blizzardAdd2.id,
    )

    // 900 heal → 900 threat to Sapphiron only (not split 3 ways = 300 each)
    expect(healerThreatOnSapphiron).toBe(900)
    expect(healerThreatOnBlizzard1).toBe(0)
    expect(healerThreatOnBlizzard2).toBe(0)
  })
})

// ─── Ossirian the Unscarred scenario ─────────────────────────────────────────

describe('Ossirian the Unscarred — Wind Vortexes excluded from split threat', () => {
  const tank = makeActor(1, 'Tank')
  const healer = makeActor(2, 'Healer')
  const ossirian = makeEnemy(18728, 'Ossirian the Unscarred')
  // Wind Vortexes — environmental adds, never target players directly
  const windVortex1 = makeEnemy(18734, 'Wind Vortex 1')
  const windVortex2 = makeEnemy(18734, 'Wind Vortex 2')
  Object.assign(windVortex2, { instance: 1 })
  const windVortex3 = makeEnemy(18734, 'Wind Vortex 3')
  Object.assign(windVortex3, { instance: 2 })

  const enemies = [ossirian, windVortex1, windVortex2, windVortex3]
  const actorMap = new Map<number, Actor>([
    [tank.id, tank],
    [healer.id, healer],
  ])
  const friendlyActorIds = new Set([tank.id, healer.id])

  it('splits heal threat only among Ossirian when Wind Vortexes never interact with players', () => {
    const events = [
      // Prepass: Ossirian melees tank
      makeDamageEvent(ossirian.id, tank.id, 1000, 100),
      // Prepass: Wind Vortexes only buff each other
      makeBuffEvent(windVortex1.id, windVortex2.id, 100),
      makeBuffEvent(windVortex2.id, windVortex3.id, 100),
      // Main events
      makeDamageEvent(tank.id, ossirian.id, 400, 1000),
      makeHealEvent(healer.id, tank.id, 1200, 2000),
    ]

    const result = processEvents({
      rawEvents: events,
      actorMap,
      friendlyActorIds,
      enemies,
      config: splitThreatConfig,
    })

    const healerThreatOnOssirian = getThreatForActor(
      result,
      healer.id,
      ossirian.id,
    )
    const healerThreatOnVortex1 = getThreatForActor(
      result,
      healer.id,
      windVortex1.id,
    )
    const healerThreatOnVortex2 = getThreatForActor(
      result,
      healer.id,
      windVortex2.id,
    )
    const healerThreatOnVortex3 = getThreatForActor(
      result,
      healer.id,
      windVortex3.id,
    )

    // 1200 heal → 1200 threat to Ossirian only (not split 4 ways = 300 each)
    expect(healerThreatOnOssirian).toBe(1200)
    expect(healerThreatOnVortex1).toBe(0)
    expect(healerThreatOnVortex2).toBe(0)
    expect(healerThreatOnVortex3).toBe(0)
  })

  it('falls back to all enemies when every enemy is insignificant', () => {
    // Edge case: if somehow no enemies interact with players, split uses all enemies.
    // Use distinct IDs to keep threat assertions per-enemy unambiguous.
    const boss2 = makeEnemy(18729, 'Ossirian Clone')
    const vortexA = makeEnemy(18735, 'Wind Vortex A')
    const vortexB = makeEnemy(18736, 'Wind Vortex B')
    const fallbackEnemies = [boss2, vortexA, vortexB]

    const events = [
      // Nobody interacts with players during prepass — all enemies insignificant
      makeBuffEvent(vortexA.id, vortexB.id, 100),
      // Heal during main pass
      makeHealEvent(healer.id, tank.id, 300, 1000),
    ]

    const result = processEvents({
      rawEvents: events,
      actorMap,
      friendlyActorIds,
      enemies: fallbackEnemies,
      config: splitThreatConfig,
    })

    // With fallback, threat splits across all 3 alive enemies = 100 each
    const healerThreatOnBoss2 = getThreatForActor(result, healer.id, boss2.id)
    const healerThreatOnVortexA = getThreatForActor(
      result,
      healer.id,
      vortexA.id,
    )
    const healerThreatOnVortexB = getThreatForActor(
      result,
      healer.id,
      vortexB.id,
    )

    expect(healerThreatOnBoss2).toBe(100)
    expect(healerThreatOnVortexA).toBe(100)
    expect(healerThreatOnVortexB).toBe(100)
  })
})
