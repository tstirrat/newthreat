/**
 * Component tests for focused-player table Wowhead link rendering.
 */
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import type { FocusedPlayerSummary, FocusedPlayerThreatRow } from '../types/app'
import { PlayerSummaryTable } from './player-summary-table'

const summary: FocusedPlayerSummary = {
  actorId: 1,
  label: 'Aegistank',
  actorClass: 'Warrior',
  talentPoints: [8, 5, 38],
  totalThreat: 1200,
  totalTps: 10,
  totalDamage: 900,
  totalHealing: 20,
  color: '#c79c6e',
}

const rows: FocusedPlayerThreatRow[] = [
  {
    key: 'ability-23922',
    abilityId: 23922,
    abilityName: 'Shield Slam',
    amount: 600,
    threat: 300,
    tps: 2.5,
  },
]

describe('PlayerSummaryTable', () => {
  it('uses configured wowhead domain for ability and aura links', () => {
    render(
      <PlayerSummaryTable
        summary={summary}
        rows={rows}
        initialAuras={[
          {
            spellId: 71,
            name: 'Defensive Stance',
            stacks: 1,
            isNotable: true,
          },
        ]}
        wowhead={{
          domain: 'tbc',
        }}
      />,
    )

    const abilityLink = screen.getByRole('link', {
      name: 'Shield Slam',
    })
    expect(abilityLink).toHaveAttribute(
      'href',
      'https://www.wowhead.com/tbc/spell=23922',
    )
    expect(abilityLink).toHaveAttribute(
      'data-wowhead',
      'spell=23922&domain=tbc',
    )

    const auraLink = screen.getByRole('link', {
      name: 'Defensive Stance',
    })
    expect(auraLink).toHaveAttribute(
      'href',
      'https://www.wowhead.com/tbc/spell=71',
    )
    expect(auraLink).toHaveAttribute('data-wowhead', 'spell=71&domain=tbc')
  })
})
