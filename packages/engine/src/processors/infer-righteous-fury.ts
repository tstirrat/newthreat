/**
 * Processor that infers Righteous Fury on paladin tanks.
 */
import type { Report, ReportFight } from '@wow-threat/wcl-types'

import {
  type FightProcessorFactory,
  addInitialAuraAddition,
  initialAuraAdditionsKey,
} from '../event-processors'

// Righteous Fury spell IDs by game version
const ERA_TBC_RIGHTEOUS_FURY_ID = 25780
const SOD_RIGHTEOUS_FURY_ID = 407627

function resolvePaladinTankActorIds(
  report: Report,
  fight: ReportFight,
  tankActorIds: Set<number> | undefined,
): number[] {
  if (!tankActorIds || tankActorIds.size === 0) {
    return []
  }

  const friendlyPlayerIds = new Set(fight.friendlyPlayers ?? [])

  return report.masterData.actors
    .filter(
      (actor) =>
        actor.type === 'Player' &&
        actor.subType === 'Paladin' &&
        friendlyPlayerIds.has(actor.id) &&
        tankActorIds.has(actor.id),
    )
    .map((actor) => actor.id)
}

/**
 * Infer Righteous Fury aura seed for paladin tanks missing it.
 */
export const createInferRighteousFuryProcessor: FightProcessorFactory = ({
  report,
  fight,
  inferThreatReduction,
  tankActorIds,
}) => {
  if (!inferThreatReduction || !report || !fight) {
    return null
  }

  const paladinTankActorIds = resolvePaladinTankActorIds(
    report,
    fight,
    tankActorIds,
  )

  if (paladinTankActorIds.length === 0) {
    return null
  }

  return {
    id: 'engine/infer-righteous-fury',
    finalizePrepass(ctx) {
      const paladinAuraModifiers = ctx.config.classes.paladin?.auraModifiers
      if (!paladinAuraModifiers) {
        return
      }

      // Prefer SoD spell ID when present; fall back to Era/TBC
      const rfSpellId: number | null =
        SOD_RIGHTEOUS_FURY_ID in paladinAuraModifiers
          ? SOD_RIGHTEOUS_FURY_ID
          : ERA_TBC_RIGHTEOUS_FURY_ID in paladinAuraModifiers
            ? ERA_TBC_RIGHTEOUS_FURY_ID
            : null

      if (rfSpellId === null) {
        return
      }

      const initialAuraAdditionsByActor = ctx.namespace.get(
        initialAuraAdditionsKey,
      )

      paladinTankActorIds.forEach((actorId) => {
        const actorAuraIds = new Set([
          ...(ctx.initialAurasByActor.get(actorId) ?? []),
          ...(initialAuraAdditionsByActor?.get(actorId) ?? []),
        ])

        const hasRighteousFury =
          actorAuraIds.has(ERA_TBC_RIGHTEOUS_FURY_ID) ||
          actorAuraIds.has(SOD_RIGHTEOUS_FURY_ID)

        if (hasRighteousFury) {
          return
        }

        addInitialAuraAddition(ctx.namespace, actorId, rfSpellId)
      })
    },
  }
}
