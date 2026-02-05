/**
 * Naxxramas Boss Abilities
 *
 * Custom threat formulas for Naxxramas bosses in Anniversary Edition.
 */

import type { ThreatFormula, ThreatModification } from '../types'

const HATEFUL_STRIKE_ID = 28308
const MELEE_RANGE = 10 // yards
const HATEFUL_STRIKE_THREAT = 1000 // TODO: Verify exact amount

/**
 * Patchwerk - Hateful Strike
 *
 * Adds fixed threat to the top 4 melee-range targets.
 * This is a boss ability cast on a player, so base threat (value) is 0.
 */
export const hatefulStrike: ThreatFormula = (ctx) => {
  const targetEnemyId = ctx.event.sourceID // Patchwerk is the source

  // Get top actors by threat against Patchwerk
  const topActors = ctx.actors.getTopActorsByThreat(targetEnemyId, 100)

  // Filter to only those in melee range of Patchwerk
  const meleeActors = topActors.filter(({ actorId }) => {
    const distance = ctx.actors.getDistance(actorId, targetEnemyId)
    return distance !== null && distance <= MELEE_RANGE
  })

  // Take top 4 in melee range
  const targets = meleeActors.slice(0, 4)

  // Build threat modifications for all 4 targets
  const modifications: ThreatModification[] = targets.map(({ actorId }) => ({
    actorId,
    enemyId: targetEnemyId,
    amount: HATEFUL_STRIKE_THREAT,
  }))

  return {
    formula: '0 (customThreat)',
    value: 0, // Boss ability on player - no base threat
    splitAmongEnemies: false,
    special: {
      type: 'customThreat',
      modifications,
    },
  }
}

/**
 * Naxxramas boss abilities
 */
export const naxxAbilities = {
  [HATEFUL_STRIKE_ID]: hatefulStrike,
}
