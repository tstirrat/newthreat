import { describe, it, expect } from 'vitest'
import { PositionTracker } from './position-tracker'

describe('PositionTracker', () => {
  it('should update and retrieve actor positions', () => {
    const tracker = new PositionTracker()
    
    tracker.updatePosition(1, 100, 200)
    tracker.updatePosition(2, 150, 250)
    
    expect(tracker.getPosition(1)).toEqual({ x: 100, y: 200 })
    expect(tracker.getPosition(2)).toEqual({ x: 150, y: 250 })
  })

  it('should return null for unknown actor positions', () => {
    const tracker = new PositionTracker()
    
    expect(tracker.getPosition(999)).toBeNull()
  })

  it('should update existing actor positions', () => {
    const tracker = new PositionTracker()
    
    tracker.updatePosition(1, 100, 200)
    tracker.updatePosition(1, 300, 400)
    
    expect(tracker.getPosition(1)).toEqual({ x: 300, y: 400 })
  })

  it('should calculate distance between two actors', () => {
    const tracker = new PositionTracker()
    
    tracker.updatePosition(1, 0, 0)
    tracker.updatePosition(2, 3, 4)
    
    const distance = tracker.getDistance(1, 2)
    expect(distance).toBe(5) // 3-4-5 triangle
  })

  it('should return null for distance when positions are missing', () => {
    const tracker = new PositionTracker()
    
    tracker.updatePosition(1, 0, 0)
    
    expect(tracker.getDistance(1, 999)).toBeNull()
    expect(tracker.getDistance(999, 1)).toBeNull()
    expect(tracker.getDistance(999, 888)).toBeNull()
  })

  it('should find actors within range', () => {
    const tracker = new PositionTracker()
    
    // Actor 1 at origin
    tracker.updatePosition(1, 0, 0)
    // Actor 2 at distance 5
    tracker.updatePosition(2, 3, 4)
    // Actor 3 at distance 10
    tracker.updatePosition(3, 6, 8)
    // Actor 4 at distance 15
    tracker.updatePosition(4, 9, 12)
    
    const actorsInRange = tracker.getActorsInRange(1, 10)
    
    expect(actorsInRange).toHaveLength(2)
    expect(actorsInRange).toContain(2)
    expect(actorsInRange).toContain(3)
    expect(actorsInRange).not.toContain(1) // Should not include self
    expect(actorsInRange).not.toContain(4) // Out of range
  })

  it('should return empty array when actor position is unknown', () => {
    const tracker = new PositionTracker()
    
    tracker.updatePosition(1, 0, 0)
    
    const actorsInRange = tracker.getActorsInRange(999, 10)
    expect(actorsInRange).toEqual([])
  })

  it('should handle zero range correctly', () => {
    const tracker = new PositionTracker()
    
    tracker.updatePosition(1, 0, 0)
    tracker.updatePosition(2, 0, 0) // Same position
    tracker.updatePosition(3, 1, 0) // Distance 1
    
    const actorsInRange = tracker.getActorsInRange(1, 0)
    
    expect(actorsInRange).toHaveLength(1)
    expect(actorsInRange).toContain(2)
  })
})
