/**
 * Unit tests for class color resolution, including light-mode overrides.
 */
import { describe, expect, it } from 'vitest'

import type { ReportActorSummary } from '../types/api'
import { classColors, getActorColor, getClassColor } from './class-colors'

describe('getClassColor', () => {
  it('returns the dark-mode color for Priest by default', () => {
    expect(getClassColor('Priest')).toBe('#FFFFFF')
  })

  it('returns the dark-mode color for Priest when isDarkMode is true', () => {
    expect(getClassColor('Priest', true)).toBe('#FFFFFF')
  })

  it('returns the light-mode override for Priest when isDarkMode is false', () => {
    expect(getClassColor('Priest', false)).toBe('#71717a')
  })

  it('returns the same color in dark and light mode for classes without an override', () => {
    const warriorDark = getClassColor('Warrior', true)
    const warriorLight = getClassColor('Warrior', false)
    expect(warriorDark).toBe('#C79C6E')
    expect(warriorLight).toBe('#C79C6E')
  })

  it('returns the same color in dark and light mode for Mage', () => {
    expect(getClassColor('Mage', true)).toBe(getClassColor('Mage', false))
  })

  it('returns fallback color for null class', () => {
    expect(getClassColor(null)).toBe('#94a3b8')
  })

  it('returns fallback color for undefined class', () => {
    expect(getClassColor(undefined)).toBe('#94a3b8')
  })

  it('returns dark-mode colors for all classes without override in light mode', () => {
    const classesWithoutOverride = Object.keys(classColors).filter(
      (c) => c !== 'Priest',
    )
    for (const cls of classesWithoutOverride) {
      expect(
        getClassColor(cls as Parameters<typeof getClassColor>[0], false),
      ).toBe(classColors[cls as keyof typeof classColors])
    }
  })
})

describe('getActorColor', () => {
  const makePlayer = (
    id: number,
    subType: 'Priest' | 'Warrior',
  ): ReportActorSummary => ({
    id,
    name: `Player-${id}`,
    type: 'Player',
    subType,
  })

  const emptyMap = new Map<number, ReportActorSummary>()

  it('returns Priest dark-mode color in dark mode', () => {
    const priest = makePlayer(1, 'Priest')
    expect(getActorColor(priest, emptyMap, true)).toBe('#FFFFFF')
  })

  it('returns Priest light-mode override in light mode', () => {
    const priest = makePlayer(1, 'Priest')
    expect(getActorColor(priest, emptyMap, false)).toBe('#71717a')
  })

  it('returns same Warrior color in both modes', () => {
    const warrior = makePlayer(1, 'Warrior')
    expect(getActorColor(warrior, emptyMap, true)).toBe(
      getActorColor(warrior, emptyMap, false),
    )
  })

  it('resolves pet color from owner class in dark mode', () => {
    const owner = makePlayer(1, 'Priest')
    const ownerMap = new Map([[1, owner]])
    const pet: ReportActorSummary = {
      id: 2,
      name: 'Minipet',
      type: 'Pet',
      petOwner: 1,
    }
    expect(getActorColor(pet, ownerMap, true)).toBe('#FFFFFF')
  })

  it('resolves pet color from owner class in light mode', () => {
    const owner = makePlayer(1, 'Priest')
    const ownerMap = new Map([[1, owner]])
    const pet: ReportActorSummary = {
      id: 2,
      name: 'Minipet',
      type: 'Pet',
      petOwner: 1,
    }
    expect(getActorColor(pet, ownerMap, false)).toBe('#71717a')
  })
})
