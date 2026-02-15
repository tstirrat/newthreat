/**
 * Naxxramas Boss Abilities
 *
 * Custom threat formulas for Naxxramas bosses in Anniversary Edition.
 */
import type { ThreatChange, ThreatFormula } from '@wcl-threat/shared'

import { modifyThreat } from '../../shared/formulas'

const Spells = {
  HatefulStrike: 28308, // https://wowhead.com/classic/spell=28308/
  NothBlink1: 29209, // https://wowhead.com/classic/spell=29209/
  NothBlink2: 29210, // https://wowhead.com/classic/spell=29210/
  NothBlink3: 29211, // https://wowhead.com/classic/spell=29211/
}

const MELEE_RANGE = 10 // yards

/**
 * Patchwerk - Hateful Strike
 *
 * Adds fixed threat to melee-range targets.
 * This is a boss ability cast on a player, so base threat (value) is 0.
 */
export const hatefulStrike =
  ({
    amount,
    playerCount,
  }: {
    amount: number
    playerCount: number
  }): ThreatFormula =>
  (ctx) => {
    const targetEnemyId = ctx.event.sourceID // Patchwerk is the source
    const targetEnemyInstance = ctx.event.sourceInstance ?? 0

    // Get top actors by threat against Patchwerk
    const topActors = ctx.actors.getTopActorsByThreat(
      {
        id: targetEnemyId,
        instanceId: targetEnemyInstance,
      },
      100,
    )
    const targetActorId = ctx.event.targetID
    const topActorIds = new Set(topActors.map(({ actorId }) => actorId))
    const targetThreat = ctx.actors.getThreat(targetActorId, {
      id: targetEnemyId,
      instanceId: targetEnemyInstance,
    })
    const topActorsWithTarget =
      topActorIds.has(targetActorId) || targetActorId <= 0
        ? topActors
        : [{ actorId: targetActorId, threat: targetThreat }, ...topActors]

    const topActorsWithDistance = topActorsWithTarget.map(
      ({ actorId, threat }) => ({
        actorId,
        threat,
        distance: ctx.actors.getDistance(
          { id: actorId },
          { id: targetEnemyId, instanceId: targetEnemyInstance },
        ),
      }),
    )

    // Some logs do not provide position payloads. If no distance data exists,
    // fall back to the top-threat ordering so Hateful Strike still applies.
    const hasDistanceData = topActorsWithDistance.some(
      ({ distance }) => distance !== null,
    )

    const meleeActors = hasDistanceData
      ? topActorsWithDistance.filter(
          ({ distance }) => distance !== null && distance <= MELEE_RANGE,
        )
      : topActorsWithDistance

    // Take top N in melee range
    const targets = meleeActors.slice(0, playerCount)

    // Build explicit ThreatChanges for all N targets
    const changes: ThreatChange[] = targets.map(({ actorId, threat }) => {
      const total = threat + amount

      return {
        sourceId: actorId,
        targetId: targetEnemyId,
        targetInstance: targetEnemyInstance,
        operator: 'add',
        amount,
        total,
      }
    })

    return {
      formula: `hatefulStrike(${amount})`,
      value: amount,
      splitAmongEnemies: false,
      effects: [{ type: 'customThreat', changes }],
    }
  }

/**
 * Naxxramas boss abilities
 */
export const naxxAbilities = {
  [Spells.HatefulStrike]: hatefulStrike({ amount: 500, playerCount: 4 }),
  [Spells.NothBlink1]: modifyThreat({ modifier: 0, target: 'all' }),
  [Spells.NothBlink2]: modifyThreat({ modifier: 0, target: 'all' }),
  [Spells.NothBlink3]: modifyThreat({ modifier: 0, target: 'all' }),
}
