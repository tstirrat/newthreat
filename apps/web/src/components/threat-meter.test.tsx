/**
 * Unit tests for the ThreatMeter component.
 */
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import type { ThreatAtTimeEntry } from '../lib/threat-at-time'
import { ThreatMeter } from './threat-meter'

function makeEntry(
  overrides: Partial<ThreatAtTimeEntry> & { actorId: number },
): ThreatAtTimeEntry {
  return {
    actorName: `Player ${overrides.actorId}`,
    actorClass: 'Warrior',
    actorType: 'Player',
    color: '#C79C6E',
    threat: 1000,
    ...overrides,
  }
}

describe('ThreatMeter', () => {
  it('renders sorted entries by threat descending', () => {
    const entries = [
      makeEntry({ actorId: 1, actorName: 'Low', threat: 100 }),
      makeEntry({ actorId: 2, actorName: 'High', threat: 500 }),
      makeEntry({ actorId: 3, actorName: 'Mid', threat: 300 }),
    ]

    render(
      <ThreatMeter
        entries={entries}
        focusedActorId={null}
        selectedPlayerIds={[]}
        playheadMs={5000}
        isExpanded={false}
        onExpandedChange={() => {}}
      />,
    )

    const items = screen.getAllByRole('listitem')
    expect(items).toHaveLength(3)
    expect(items[0]).toHaveTextContent('High')
    expect(items[1]).toHaveTextContent('Mid')
    expect(items[2]).toHaveTextContent('Low')
  })

  it('filters out zero-threat entries', () => {
    const entries = [
      makeEntry({ actorId: 1, actorName: 'Active', threat: 500 }),
      makeEntry({ actorId: 2, actorName: 'Idle', threat: 0 }),
    ]

    render(
      <ThreatMeter
        entries={entries}
        focusedActorId={null}
        selectedPlayerIds={[]}
        playheadMs={5000}
        isExpanded={false}
        onExpandedChange={() => {}}
      />,
    )

    expect(screen.getAllByRole('listitem')).toHaveLength(1)
    expect(screen.getByText('Active')).toBeInTheDocument()
  })

  it('shows expand button when more than 10 entries', () => {
    const entries = Array.from({ length: 15 }, (_, i) =>
      makeEntry({ actorId: i + 1, threat: 1000 - i * 10 }),
    )

    render(
      <ThreatMeter
        entries={entries}
        focusedActorId={null}
        selectedPlayerIds={[]}
        playheadMs={5000}
        isExpanded={false}
        onExpandedChange={() => {}}
      />,
    )

    expect(screen.getAllByRole('listitem')).toHaveLength(10)
    expect(screen.getByText(/Show all \(15\)/)).toBeInTheDocument()
  })

  it('shows all entries when expanded', () => {
    const entries = Array.from({ length: 15 }, (_, i) =>
      makeEntry({ actorId: i + 1, threat: 1000 - i * 10 }),
    )

    render(
      <ThreatMeter
        entries={entries}
        focusedActorId={null}
        selectedPlayerIds={[]}
        playheadMs={5000}
        isExpanded={true}
        onExpandedChange={() => {}}
      />,
    )

    expect(screen.getAllByRole('listitem')).toHaveLength(15)
    expect(screen.getByText(/Show top 10/)).toBeInTheDocument()
  })

  it('calls onExpandedChange when clicking expand button', async () => {
    const onExpandedChange = vi.fn()
    const entries = Array.from({ length: 15 }, (_, i) =>
      makeEntry({ actorId: i + 1, threat: 1000 - i * 10 }),
    )

    render(
      <ThreatMeter
        entries={entries}
        focusedActorId={null}
        selectedPlayerIds={[]}
        playheadMs={5000}
        isExpanded={false}
        onExpandedChange={onExpandedChange}
      />,
    )

    await userEvent.click(screen.getByText(/Show all/))
    expect(onExpandedChange).toHaveBeenCalledWith(true)
  })

  it('shows empty state when no threat', () => {
    render(
      <ThreatMeter
        entries={[makeEntry({ actorId: 1, threat: 0 })]}
        focusedActorId={null}
        selectedPlayerIds={[]}
        playheadMs={0}
        isExpanded={false}
        onExpandedChange={() => {}}
      />,
    )

    expect(screen.getByText('No threat at this time.')).toBeInTheDocument()
  })

  it('de-emphasizes filtered-out players', () => {
    const entries = [
      makeEntry({ actorId: 1, actorName: 'Selected', threat: 500 }),
      makeEntry({ actorId: 2, actorName: 'Filtered', threat: 300 }),
    ]

    render(
      <ThreatMeter
        entries={entries}
        focusedActorId={null}
        selectedPlayerIds={[1]}
        playheadMs={5000}
        isExpanded={false}
        onExpandedChange={() => {}}
      />,
    )

    const items = screen.getAllByRole('listitem')
    expect(items[0]).not.toHaveClass('opacity-40')
    expect(items[1]).toHaveClass('opacity-40')
  })
})
