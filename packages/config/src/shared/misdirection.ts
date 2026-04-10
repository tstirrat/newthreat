/**
 * Misdirection interceptor — shared between TBC and SoD hunter configs.
 *
 * Handles threat redirection logic for the Misdirection ability, including
 * AoE overflow charge tracking for Explosive Trap.
 */
import type { EventInterceptor } from '@wow-threat/shared'

const MISDIRECTION_DURATION_MS = 30000
const MISDIRECTION_MAX_CHARGES = 3

const misdirectionAoeOverflowSpellIds = new Set<number>([
  13812, // Explosive Trap Effect R1
  14314, // Explosive Trap Effect R2
  14315, // Explosive Trap Effect R3
  27025, // Explosive Trap Effect R4
])

interface RedirectOverflowWindow {
  abilityGameID: number
  timestamp: number
}

/** Create a Misdirection interceptor for a hunter and redirected ally target. */
export function createMisdirectionInterceptor(
  hunterId: number,
  targetId: number,
): EventInterceptor {
  let chargesRemaining = MISDIRECTION_MAX_CHARGES
  let redirectOverflowWindow: RedirectOverflowWindow | null = null

  return (event, ctx) => {
    if (ctx.timestamp - ctx.installedAt > MISDIRECTION_DURATION_MS) {
      ctx.uninstall()
      return { action: 'passthrough' }
    }

    if (redirectOverflowWindow !== null) {
      if (event.timestamp > redirectOverflowWindow.timestamp) {
        ctx.uninstall()
        return { action: 'passthrough' }
      }

      if (
        event.type === 'damage' &&
        event.sourceID === hunterId &&
        !event.tick &&
        event.abilityGameID === redirectOverflowWindow.abilityGameID &&
        event.timestamp === redirectOverflowWindow.timestamp
      ) {
        if (!ctx.actors.isActorAlive({ id: targetId })) {
          return { action: 'passthrough' }
        }

        return {
          action: 'augment',
          threatRecipientOverride: targetId,
        }
      }

      return { action: 'passthrough' }
    }

    if (event.type !== 'damage' || event.sourceID !== hunterId) {
      return { action: 'passthrough' }
    }

    if (event.tick) {
      return { action: 'passthrough' }
    }

    chargesRemaining -= 1

    if (chargesRemaining <= 0) {
      if (misdirectionAoeOverflowSpellIds.has(event.abilityGameID)) {
        redirectOverflowWindow = {
          abilityGameID: event.abilityGameID,
          timestamp: event.timestamp,
        }
      } else {
        ctx.uninstall()
      }
    }

    if (!ctx.actors.isActorAlive({ id: targetId })) {
      return { action: 'passthrough' }
    }

    return {
      action: 'augment',
      threatRecipientOverride: targetId,
    }
  }
}
