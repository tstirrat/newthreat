/**
 * Tests for talent-rank helper utilities
 */
import { describe, expect, it } from 'vitest'

import { clampRank, inferMappedTalentRank } from './talents'

describe('clampRank', () => {
  it('returns 0 for negative ranks', () => {
    expect(clampRank(-3, 5)).toBe(0)
  })

  it('caps ranks at maxRank', () => {
    expect(clampRank(9, 5)).toBe(5)
  })

  it('truncates fractional ranks', () => {
    expect(clampRank(2.9, 5)).toBe(2)
  })
})

describe('inferMappedTalentRank', () => {
  it('infers rank from rank-mapped spell IDs', () => {
    const talentRanks = new Map<number, number>([[1002, 1]])
    const rankByTalentId = new Map<number, number>([
      [1001, 1],
      [1002, 2],
      [1003, 3],
    ])

    expect(inferMappedTalentRank(talentRanks, rankByTalentId, 3)).toBe(2)
  })

  it('uses explicit rank values when provided for mapped IDs', () => {
    const talentRanks = new Map<number, number>([[1001, 3]])
    const rankByTalentId = new Map<number, number>([[1001, 1]])

    expect(inferMappedTalentRank(talentRanks, rankByTalentId, 5)).toBe(3)
  })

  it('ignores unmapped talent IDs', () => {
    const talentRanks = new Map<number, number>([[9999, 5]])
    const rankByTalentId = new Map<number, number>([[1001, 1]])

    expect(inferMappedTalentRank(talentRanks, rankByTalentId, 5)).toBe(0)
  })
})
