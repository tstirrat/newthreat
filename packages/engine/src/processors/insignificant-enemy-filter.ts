/**
 * Processor that identifies insignificant enemies during the prepass phase.
 *
 * An enemy is insignificant if it never interacts with players — it never casts
 * on a player, never has a player cast against it, and only self-casts or interacts
 * with other enemies. These are typically boss fight decorations (Gothik
 * non-character adds, Sapphiron Blizzard adds, Ossirian Wind Vortexes).
 */
import { createProcessorDataKey, type FightProcessorFactory } from '../event-processors'
import type { ActorId } from '../instance-refs'

/** Key for the set of significant enemy IDs stored in the processor namespace. */
export const significantEnemyIdsKey = createProcessorDataKey<Set<ActorId>>(
  'engine:significant-enemy-ids',
)

export const createInsignificantEnemyFilterProcessor: FightProcessorFactory = () => {
  const enemyPlayerInteractions = new Set<ActorId>()
  let enemyIds: Set<ActorId> | null = null

  return {
    id: 'engine/insignificant-enemy-filter',

    init(ctx) {
      enemyIds = new Set(ctx.enemies.map((e) => e.id))
    },

    visitPrepass(event, ctx) {
      if (!enemyIds) return

      const { friendlyActorIds } = ctx

      const sourceIsEnemy = enemyIds.has(event.sourceID)
      const targetIsEnemy = enemyIds.has(event.targetID)
      const sourceIsFriendly = friendlyActorIds?.has(event.sourceID) ?? false
      const targetIsFriendly = friendlyActorIds?.has(event.targetID) ?? false

      // Enemy casts on/against a player → significant
      if (sourceIsEnemy && targetIsFriendly) {
        enemyPlayerInteractions.add(event.sourceID)
      }

      // Player casts on/against an enemy → significant
      if (targetIsEnemy && sourceIsFriendly) {
        enemyPlayerInteractions.add(event.targetID)
      }
    },

    finalizePrepass(ctx) {
      const significantEnemyIds = new Set<ActorId>()

      for (const enemy of ctx.enemies) {
        if (enemyPlayerInteractions.has(enemy.id)) {
          significantEnemyIds.add(enemy.id)
        }
      }

      ctx.namespace.set(significantEnemyIdsKey, significantEnemyIds)
      enemyPlayerInteractions.clear()
    },
  }
}
