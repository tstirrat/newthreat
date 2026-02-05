/**
 * Tests for Built-in Threat Formulas
 */

import { describe, it, expect } from 'vitest'
import type { ThreatContext } from '../types'
import {
  calculateThreat,
  tauntTarget,
  threatDrop,
  noThreat,
} from './formulas'

// Mock ThreatContext factory
function createMockContext(overrides: Partial<ThreatContext> = {}): ThreatContext {
  return {
    event: { type: 'damage' } as ThreatContext['event'],
    amount: 100,
    sourceAuras: new Set(),
    targetAuras: new Set(),
    enemies: [],
    sourceActor: { id: 1, name: 'TestPlayer', class: 'warrior' },
    targetActor: { id: 2, name: 'TestEnemy', class: null },
    encounterId: null,
    ...overrides,
  }
}

describe('calculateThreat', () => {
  it('returns default threat (amt) with no options', () => {
    const formula = calculateThreat()
    const ctx = createMockContext({ amount: 500 })

    const result = formula(ctx)

    expect(result.formula).toBe('amt')
    expect(result.baseThreat).toBe(500)
    expect(result.splitAmongEnemies).toBe(false)
    expect(result.modifiers).toEqual([])
  })

  it('applies modifier to amount', () => {
    const formula = calculateThreat({ modifier: 2 })
    const ctx = createMockContext({ amount: 100 })

    const result = formula(ctx)

    expect(result.formula).toBe('amt * 2')
    expect(result.baseThreat).toBe(200)
  })

  it('applies modifier with decimal values', () => {
    const formula = calculateThreat({ modifier: 0.5 })
    const ctx = createMockContext({ amount: 100 })

    const result = formula(ctx)

    expect(result.formula).toBe('amt * 0.5')
    expect(result.baseThreat).toBe(50)
  })

  it('returns flat bonus threat with modifier: 0', () => {
    const formula = calculateThreat({ modifier: 0, bonus: 301 })
    const ctx = createMockContext({ amount: 100 })

    const result = formula(ctx)

    expect(result.formula).toBe('301')
    expect(result.baseThreat).toBe(301)
  })

  it('applies both modifier and bonus', () => {
    const formula = calculateThreat({ modifier: 2, bonus: 150 })
    const ctx = createMockContext({ amount: 100 })

    const result = formula(ctx)

    expect(result.formula).toBe('(amt * 2) + 150')
    expect(result.baseThreat).toBe(350) // (100 * 2) + 150
  })

  it('applies bonus without modifier', () => {
    const formula = calculateThreat({ modifier: 1, bonus: 145 })
    const ctx = createMockContext({ amount: 100 })

    const result = formula(ctx)

    expect(result.formula).toBe('amt + 145')
    expect(result.baseThreat).toBe(245)
  })

  it('supports split option', () => {
    const formula = calculateThreat({ modifier: 0, bonus: 70, split: true })
    const ctx = createMockContext()

    const result = formula(ctx)

    expect(result.formula).toBe('70')
    expect(result.baseThreat).toBe(70)
    expect(result.splitAmongEnemies).toBe(true)
  })

  it('handles negative bonus (threat reduction)', () => {
    const formula = calculateThreat({ modifier: 0, bonus: -240 })
    const ctx = createMockContext()

    const result = formula(ctx)

    expect(result.formula).toBe('-240')
    expect(result.baseThreat).toBe(-240)
  })

  it('handles zero threat', () => {
    const formula = calculateThreat({ modifier: 0, bonus: 0 })
    const ctx = createMockContext({ amount: 100 })

    const result = formula(ctx)

    expect(result.formula).toBe('0')
    expect(result.baseThreat).toBe(0)
  })

  it('handles complex formula with modifier and split', () => {
    const formula = calculateThreat({ modifier: 0.5, split: true })
    const ctx = createMockContext({ amount: 1000 })

    const result = formula(ctx)

    expect(result.formula).toBe('amt * 0.5')
    expect(result.baseThreat).toBe(500)
    expect(result.splitAmongEnemies).toBe(true)
  })

  it('handles modifier with bonus and split', () => {
    const formula = calculateThreat({ modifier: 1.75, bonus: 50, split: false })
    const ctx = createMockContext({ amount: 100 })

    const result = formula(ctx)

    expect(result.formula).toBe('(amt * 1.75) + 50')
    expect(result.baseThreat).toBe(225) // (100 * 1.75) + 50
    expect(result.splitAmongEnemies).toBe(false)
  })
})

describe('tauntTarget', () => {
  it('returns taunt special with fixate duration', () => {
    const formula = tauntTarget(1, 3000)
    const ctx = createMockContext({ amount: 0 })

    const result = formula(ctx)

    expect(result.formula).toBe('topThreat + 1')
    expect(result.baseThreat).toBe(1)
    expect(result.special).toEqual({ type: 'taunt', fixateDuration: 3000 })
    expect(result.splitAmongEnemies).toBe(false)
  })

  it('includes damage when addDamage option set', () => {
    const formula = tauntTarget(0, 6000, { addDamage: true })
    const ctx = createMockContext({ amount: 500 })

    const result = formula(ctx)

    expect(result.formula).toBe('topThreat + amt + 0')
    expect(result.baseThreat).toBe(500) // Just the damage, bonus is 0
    expect(result.special).toEqual({ type: 'taunt', fixateDuration: 6000 })
  })

  it('adds damage + bonus threat together', () => {
    const formula = tauntTarget(100, 4000, { addDamage: true })
    const ctx = createMockContext({ amount: 300 })

    const result = formula(ctx)

    expect(result.formula).toBe('topThreat + amt + 100')
    expect(result.baseThreat).toBe(400) // 300 damage + 100 bonus
  })
})

describe('threatDrop', () => {
  it('returns threat drop special', () => {
    const formula = threatDrop()
    const ctx = createMockContext()

    const result = formula(ctx)

    expect(result.formula).toBe('threatDrop')
    expect(result.baseThreat).toBe(0)
    expect(result.special).toEqual({ type: 'threatDrop' })
    expect(result.splitAmongEnemies).toBe(false)
  })
})

describe('noThreat', () => {
  it('returns zero threat without duration', () => {
    const formula = noThreat()
    const ctx = createMockContext()

    const result = formula(ctx)

    expect(result.formula).toBe('0')
    expect(result.baseThreat).toBe(0)
    expect(result.special).toBeUndefined()
  })

  it('returns no threat window with duration', () => {
    const formula = noThreat(30000)
    const ctx = createMockContext()

    const result = formula(ctx)

    expect(result.formula).toBe('0')
    expect(result.baseThreat).toBe(0)
    expect(result.special).toEqual({ type: 'noThreatWindow', duration: 30000 })
  })
})
