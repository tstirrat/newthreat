/**
 * Serialization helpers for initialAurasByActor, shared across API and web packages.
 */

/** Serialize a Map of actor ID → aura spell IDs to a plain JSON-compatible record. */
export function serializeInitialAurasByActor(
  initialAurasByActor: Map<number, readonly number[]>,
): Record<string, number[]> {
  return Object.fromEntries(
    [...initialAurasByActor.entries()]
      .filter(([, auraIds]) => auraIds.length > 0)
      .map(([actorId, auraIds]) => [
        String(actorId),
        [...new Set(auraIds)].sort((left, right) => left - right),
      ]),
  )
}

/** Deserialize a plain record of actor ID → aura spell IDs back to a typed Map. */
export function deserializeInitialAurasByActor(
  initialAurasByActor: Record<string, number[]> | undefined,
): Map<number, readonly number[]> {
  if (!initialAurasByActor) {
    return new Map()
  }

  return Object.entries(initialAurasByActor).reduce(
    (result, [actorId, auraIds]) => {
      const parsedActorId = Number.parseInt(actorId, 10)
      if (!Number.isFinite(parsedActorId)) {
        return result
      }

      const sanitizedAuraIds = auraIds
        .filter((auraId) => Number.isFinite(auraId))
        .map((auraId) => Math.trunc(auraId))
      if (sanitizedAuraIds.length === 0) {
        return result
      }

      result.set(
        parsedActorId,
        [...new Set(sanitizedAuraIds)].sort((left, right) => left - right),
      )
      return result
    },
    new Map<number, readonly number[]>(),
  )
}
