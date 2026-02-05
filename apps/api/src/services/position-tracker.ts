/**
 * Position Tracker
 *
 * Tracks XY coordinates for all actors throughout a fight.
 * Used for abilities that require distance calculations (e.g., Patchwerk's Hateful Strike).
 */

export class PositionTracker {
  private positions = new Map<number, { x: number; y: number }>()

  /**
   * Update the position of an actor
   */
  updatePosition(actorId: number, x: number, y: number): void {
    this.positions.set(actorId, { x, y })
  }

  /**
   * Get the current position of an actor
   * @returns Position or null if not available
   */
  getPosition(actorId: number): { x: number; y: number } | null {
    return this.positions.get(actorId) ?? null
  }

  /**
   * Calculate the distance between two actors
   * @returns Distance in yards, or null if either position is unavailable
   */
  getDistance(actorId1: number, actorId2: number): number | null {
    const pos1 = this.getPosition(actorId1)
    const pos2 = this.getPosition(actorId2)
    if (!pos1 || !pos2) return null

    const dx = pos2.x - pos1.x
    const dy = pos2.y - pos1.y
    return Math.sqrt(dx * dx + dy * dy)
  }

  /**
   * Get all actors within a certain distance of a given actor
   * @returns Array of actor IDs within range
   */
  getActorsInRange(actorId: number, maxDistance: number): number[] {
    const pos = this.getPosition(actorId)
    if (!pos) return []

    const result: number[] = []
    for (const [otherId, otherPos] of this.positions) {
      if (otherId === actorId) continue
      const dx = otherPos.x - pos.x
      const dy = otherPos.y - pos.y
      const distance = Math.sqrt(dx * dx + dy * dy)
      if (distance <= maxDistance) {
        result.push(otherId)
      }
    }
    return result
  }
}
