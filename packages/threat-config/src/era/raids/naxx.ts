/**
 * Naxxramas Boss Abilities
 *
 * Custom threat formulas for Naxxramas bosses in Anniversary Edition.
 */
import type { ThreatChange, ThreatFormula } from '@wcl-threat/shared'

import { modifyThreat } from '../../shared/formulas'

const HATEFUL_STRIKE_ID = 28308
const NOTH_BLINK_ID = 29210
const NOTH_BLINK_ALT_ID = 29211
const MELEE_RANGE = 10 // yards
const HATEFUL_STRIKE_THREAT = 500

/**
 * Patchwerk - Hateful Strike
 *
 * Adds fixed threat to the top 4 melee-range targets.
 * This is a boss ability cast on a player, so base threat (value) is 0.
 */
export const hatefulStrike =
  (
    hatefulAmount: number,
    { playerCount }: { playerCount?: number },
  ): ThreatFormula =>
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

    // Filter to only those in melee range of Patchwerk
    const meleeActors = topActors.filter(({ actorId }) => {
      const distance = ctx.actors.getDistance(
        { id: actorId },
        { id: targetEnemyId, instanceId: targetEnemyInstance },
      )
      return distance !== null && distance <= MELEE_RANGE
    })

    // Take top N in melee range
    const targets = meleeActors.slice(0, playerCount)

    // Build explicit ThreatChanges for all N targets
    const changes: ThreatChange[] = targets.map(({ actorId, threat }) => {
      const total = threat + hatefulAmount

      return {
        sourceId: actorId,
        targetId: targetEnemyId,
        targetInstance: targetEnemyInstance,
        operator: 'add',
        amount: hatefulAmount,
        total,
      }
    })

    return {
      formula: `hatefulStrike(${hatefulAmount})`,
      value: 0, // Boss ability on player - no base threat
      splitAmongEnemies: false,
      effects: [{ type: 'customThreat', changes }],
    }
  }

/**
 * Naxxramas boss abilities
 */
export const naxxAbilities = {
  [HATEFUL_STRIKE_ID]: hatefulStrike(HATEFUL_STRIKE_THREAT, { playerCount: 4 }),
  [NOTH_BLINK_ID]: modifyThreat({ modifier: 0, target: 'all' }),
  [NOTH_BLINK_ALT_ID]: modifyThreat({ modifier: 0, target: 'all' }),
}
