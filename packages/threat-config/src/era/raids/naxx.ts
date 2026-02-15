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

// Position payloads are raw map units; for this fight, ~200 raw units ~= 1 yard.
const RAW_DISTANCE_UNITS_PER_YARD = 200
const PATCHWERK_MELEE_RANGE_YARDS = 7

/**
 * Patchwerk - Hateful Strike
 *
 * Adds fixed threat to the direct target, plus additional melee-range actors.
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
    const targetEnemy = {
      id: targetEnemyId,
      instanceId: targetEnemyInstance,
    }
    const directTargetId = ctx.event.targetID
    const includeDirectTarget = directTargetId > 0

    // Top actors by threat against Patchwerk, excluding the direct target.
    const topActors = ctx.actors.getTopActorsByThreat(targetEnemy, 100)
    const additionalCandidates = topActors.filter(
      ({ actorId }) => actorId > 0 && actorId !== directTargetId,
    )

    const additionalCandidatesWithDistance = additionalCandidates.map(
      ({ actorId, threat }) => {
        const rawDistance = ctx.actors.getDistance(
          { id: actorId },
          { id: targetEnemyId, instanceId: targetEnemyInstance },
        )

        return {
          actorId,
          threat,
          distanceYards:
            rawDistance === null
              ? null
              : rawDistance / RAW_DISTANCE_UNITS_PER_YARD,
        }
      },
    )

    const additionalCandidatesWithKnownDistance =
      additionalCandidatesWithDistance.filter(
        ({ distanceYards }) =>
          distanceYards !== null && Number.isFinite(distanceYards),
      )

    // Some logs do not provide position payloads. If no distance data exists,
    // fall back to top-threat ordering for additional targets.
    const hasDistanceData = additionalCandidatesWithKnownDistance.length > 0

    const meleeAdditionalCandidates = hasDistanceData
      ? additionalCandidatesWithKnownDistance.filter(
          ({ distanceYards }) =>
            distanceYards !== null &&
            distanceYards <= PATCHWERK_MELEE_RANGE_YARDS,
        )
      : additionalCandidatesWithDistance

    const additionalTargetCount = Math.max(
      0,
      playerCount - (includeDirectTarget ? 1 : 0),
    )
    const additionalTargets = meleeAdditionalCandidates.slice(
      0,
      additionalTargetCount,
    )

    const directTarget = includeDirectTarget
      ? [
          {
            actorId: directTargetId,
            threat: ctx.actors.getThreat(directTargetId, targetEnemy),
          },
        ]
      : []

    const targets = [...directTarget, ...additionalTargets]

    // Build explicit ThreatChanges for all selected targets.
    const changes: ThreatChange[] = targets.map(({ actorId, threat }) => {
      const total = threat + amount

      return {
        sourceId: actorId,
        targetId: targetEnemy.id,
        targetInstance: targetEnemy.instanceId,
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
