/**
 * Unit tests for threat chart tooltip formatter output.
 */
import { ResourceTypeCode } from '@wcl-threat/wcl-types'
import { describe, expect, it } from 'vitest'

import type { ThreatSeries } from '../types/app'
import { createThreatChartTooltipFormatter } from './threat-chart-tooltip'

const baseSeries: ThreatSeries = {
  actorId: 1,
  actorName: 'Tank',
  actorClass: 'Warrior',
  actorType: 'Player',
  ownerId: null,
  label: 'Tank',
  color: '#c79c6e',
  points: [],
  maxThreat: 0,
  totalThreat: 0,
  totalDamage: 0,
  totalHealing: 0,
  stateVisualSegments: [],
  fixateWindows: [],
  invulnerabilityWindows: [],
}

describe('threat-chart-tooltip', () => {
  it('renders escaped names with aura, marker, split, and modifiers rows', () => {
    const formatter = createThreatChartTooltipFormatter({
      series: [
        {
          ...baseSeries,
          stateVisualSegments: [
            {
              kind: 'fixate',
              spellId: 694,
              spellName: 'Mocking Blow',
              startMs: 10000,
              endMs: 20000,
            },
          ],
        },
      ],
      themeColors: {
        border: '#d1d5db',
        foreground: '#0f172a',
        muted: '#64748b',
        panel: '#ffffff',
      },
    })

    const tooltip = formatter({
      seriesName: 'Tank <A>',
      data: {
        actorId: 1,
        actorColor: '#a855f7',
        abilityName: 'Sunder <Armor>',
        amount: 240,
        baseThreat: 0,
        eventType: 'damage',
        formula: 'base < calc',
        modifiedThreat: 300,
        spellSchool: 'Fire',
        modifiers: [
          {
            name: 'Defensive <Stance>',
            schoolLabels: ['physical'],
            value: 1.3,
          },
        ],
        threatDelta: 100,
        timeMs: 15000,
        totalThreat: 1200,
        markerKind: 'bossMelee',
      },
    })

    expect(tooltip).toContain('Sunder &lt;Armor&gt;')
    expect(tooltip).toContain('Tank &lt;A&gt;')
    expect(tooltip).toContain('T: 0:15.000')
    expect(tooltip).toContain('Amt: 240.00 (fire)')
    expect(tooltip).toContain('base &lt; calc')
    expect(tooltip).toContain('Threat: +100.00 / 3')
    expect(tooltip).toContain('Multipliers:')
    expect(tooltip).toContain('1.30')
    const multipliersIndex = tooltip.indexOf('Multipliers:')
    const threatIndex = tooltip.indexOf('Threat: +100.00 / 3')
    expect(multipliersIndex).toBeGreaterThanOrEqual(0)
    expect(threatIndex).toBeGreaterThan(multipliersIndex)
    expect(tooltip).toContain('Defensive &lt;Stance&gt;')
    expect(tooltip).toContain(
      'Aura: <strong style="color:#ffa500">fixate (Mocking Blow)</strong>',
    )
    expect(tooltip).toContain(
      'Marker: <strong style="color:#ef4444">Boss melee</strong>',
    )
  })

  it('renders resource labels and non-damage event suffixes', () => {
    const formatter = createThreatChartTooltipFormatter({
      series: [baseSeries],
      themeColors: {
        border: '#d1d5db',
        foreground: '#0f172a',
        muted: '#64748b',
        panel: '#ffffff',
      },
    })

    const tooltip = formatter({
      seriesName: 'Tank',
      data: {
        actorId: 1,
        actorColor: '#c79c6e',
        abilityName: 'Bloodrage',
        amount: 20,
        baseThreat: 0,
        eventType: 'energize',
        formula: 'resource',
        modifiedThreat: -55,
        resourceType: ResourceTypeCode.Rage,
        spellSchool: null,
        modifiers: [{ name: 'Normal', schoolLabels: [], value: 1 }],
        threatDelta: -55,
        timeMs: 5000,
        totalThreat: 145,
      },
    })

    expect(tooltip).toContain('Bloodrage (energize)')
    expect(tooltip).toContain('Rage: 20.00')
    expect(tooltip).toContain('Threat: -55.00')
    expect(tooltip).not.toContain('Multipliers:')
  })
})
