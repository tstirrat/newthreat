/**
 * Processor that identifies insignificant enemies during the prepass phase.
 *
 * An enemy is significant only if a player actively casts on or against it.
 * Environmental NPCs (Sapphiron Blizzard adds, Ossirian Wind Vortexes) may
 * deal damage to players but are never targeted by players — they are excluded
 * from split-threat distribution.
 */
import {
  type FightProcessorFactory,
  createProcessorDataKey,
} from '../event-processors'
import type { ActorId } from '../instance-refs'

/** Key for the set of significant enemy IDs stored in the processor namespace. */
export const significantEnemyIdsKey = createProcessorDataKey<Set<ActorId>>(
  'engine:significant-enemy-ids',
)

export const createInsignificantEnemyFilterProcessor: FightProcessorFactory =
  () => {
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

        const targetIsEnemy = enemyIds.has(event.targetID)
        const sourceIsFriendly = friendlyActorIds?.has(event.sourceID) ?? false

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
