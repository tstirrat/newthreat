/**
 * Shared talent-rank inference helpers
 *
 * Utilities in this module normalize and clamp inferred talent ranks so class
 * configs can consistently derive synthetic aura IDs from combatant info data.
 */

/**
 * Clamp a rank value to the valid interval [0, maxRank].
 */
export function clampRank(rank: number, maxRank: number): number {
  return Math.max(0, Math.min(maxRank, Math.trunc(rank)))
}

/**
 * Infer a talent rank using a map of talent spell IDs to concrete rank values.
 *
 * Some combatant payloads provide rank-specific talent IDs with rank=1 while
 * others may provide a rank value directly. This helper accepts either and
 * returns the highest valid rank observed.
 */
export function inferMappedTalentRank(
  talentRanks: ReadonlyMap<number, number>,
  rankByTalentId: ReadonlyMap<number, number>,
  maxRank: number,
): number {
  const inferredRank = [...talentRanks.entries()].reduce(
    (highestRank, [talentId, rank]) => {
      const mappedRank = rankByTalentId.get(talentId) ?? 0
      if (mappedRank === 0) {
        return highestRank
      }
      return Math.max(highestRank, mappedRank, rank)
    },
    0,
  )

  return clampRank(inferredRank, maxRank)
}
