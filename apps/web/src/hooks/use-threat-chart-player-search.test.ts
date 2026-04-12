/**
 * Unit tests for the threat chart player search hook.
 */
import { act, renderHook } from '@testing-library/react'
import type { PostHog } from 'posthog-js'
import { describe, expect, it, vi } from 'vitest'

import type { ThreatSeries } from '../types/app'
import { useThreatChartPlayerSearch } from './use-threat-chart-player-search'

function createMockPosthog(): PostHog {
  return { capture: vi.fn() } as unknown as PostHog
}

function createSeries(overrides: Partial<ThreatSeries> = {}): ThreatSeries {
  return {
    actorId: 1,
    actorName: 'Testplayer',
    actorClass: 'Warrior',
    actorType: 'Player',
    ownerId: null,
    label: 'Testplayer',
    color: '#ffffff',
    points: [],
    maxThreat: 0,
    totalThreat: 0,
    totalDamage: 0,
    totalHealing: 0,
    stateVisualSegments: [],
    fixateWindows: [],
    invulnerabilityWindows: [],
    ...overrides,
  }
}

function createProps(
  overrides: Partial<Parameters<typeof useThreatChartPlayerSearch>[0]> = {},
): Parameters<typeof useThreatChartPlayerSearch>[0] {
  return {
    series: [],
    focusedActorId: null,
    onFocusAndAddPlayer: vi.fn(),
    onFocusAndIsolatePlayer: vi.fn(),
    onToggleFocusedPlayerIsolation: vi.fn(),
    clearIsolate: vi.fn(),
    fightId: 1,
    reportId: 'ABC123',
    ...overrides,
  }
}

describe('useThreatChartPlayerSearch', () => {
  describe('initial state', () => {
    it('starts with search closed', () => {
      const { result } = renderHook(() =>
        useThreatChartPlayerSearch(createProps()),
      )

      expect(result.current.isPlayerSearchOpen).toBe(false)
      expect(result.current.playerSearchQuery).toBe('')
      expect(result.current.resolvedHighlightedPlayerId).toBeNull()
    })
  })

  describe('openPlayerSearch / closePlayerSearch', () => {
    it('opens search and resets query', () => {
      const { result } = renderHook(() =>
        useThreatChartPlayerSearch(createProps()),
      )

      act(() => {
        result.current.openPlayerSearch()
      })

      expect(result.current.isPlayerSearchOpen).toBe(true)
      expect(result.current.playerSearchQuery).toBe('')
    })

    it('closes search and clears query', () => {
      const { result } = renderHook(() =>
        useThreatChartPlayerSearch(createProps()),
      )

      act(() => {
        result.current.openPlayerSearch()
        result.current.setPlayerSearchQuery('tank')
      })

      act(() => {
        result.current.closePlayerSearch()
      })

      expect(result.current.isPlayerSearchOpen).toBe(false)
      expect(result.current.playerSearchQuery).toBe('')
    })
  })

  describe('filteredPlayerSearchOptions', () => {
    it('returns all players when query is empty', () => {
      const series = [
        createSeries({ actorId: 1, actorName: 'Alpha', label: 'Alpha' }),
        createSeries({ actorId: 2, actorName: 'Beta', label: 'Beta' }),
      ]
      const { result } = renderHook(() =>
        useThreatChartPlayerSearch(createProps({ series })),
      )

      expect(result.current.filteredPlayerSearchOptions).toHaveLength(2)
    })

    it('filters players by query', () => {
      const series = [
        createSeries({ actorId: 1, actorName: 'Warrior', label: 'Warrior' }),
        createSeries({ actorId: 2, actorName: 'Mage', label: 'Mage' }),
      ]
      const { result } = renderHook(() =>
        useThreatChartPlayerSearch(createProps({ series })),
      )

      act(() => {
        result.current.setPlayerSearchQuery('war')
      })

      expect(result.current.filteredPlayerSearchOptions).toHaveLength(1)
      expect(result.current.filteredPlayerSearchOptions[0]?.actorId).toBe(1)
    })
  })

  describe('resolvedHighlightedPlayerId', () => {
    it('defaults to first option when no explicit highlight', () => {
      const series = [
        createSeries({ actorId: 1, actorName: 'Alpha', label: 'Alpha' }),
        createSeries({ actorId: 2, actorName: 'Beta', label: 'Beta' }),
      ]
      const { result } = renderHook(() =>
        useThreatChartPlayerSearch(createProps({ series })),
      )

      expect(result.current.resolvedHighlightedPlayerId).toBe(1)
    })

    it('respects explicit highlight when player is in filtered list', () => {
      const series = [
        createSeries({ actorId: 1, actorName: 'Alpha', label: 'Alpha' }),
        createSeries({ actorId: 2, actorName: 'Beta', label: 'Beta' }),
      ]
      const { result } = renderHook(() =>
        useThreatChartPlayerSearch(createProps({ series })),
      )

      act(() => {
        result.current.setHighlightedPlayerId(2)
      })

      expect(result.current.resolvedHighlightedPlayerId).toBe(2)
    })

    it('falls back to first option when highlighted player is not in filtered results', () => {
      const series = [
        createSeries({ actorId: 1, actorName: 'Warrior', label: 'Warrior' }),
        createSeries({ actorId: 2, actorName: 'Mage', label: 'Mage' }),
      ]
      const { result } = renderHook(() =>
        useThreatChartPlayerSearch(createProps({ series })),
      )

      act(() => {
        result.current.setHighlightedPlayerId(2)
        result.current.setPlayerSearchQuery('war')
      })

      // Mage is no longer in the filtered list, so resolves to first visible
      expect(result.current.resolvedHighlightedPlayerId).toBe(1)
    })
  })

  describe('keyboard navigation', () => {
    it('moves highlight down with ArrowDown', () => {
      const series = [
        createSeries({ actorId: 1, actorName: 'Alpha', label: 'Alpha' }),
        createSeries({ actorId: 2, actorName: 'Beta', label: 'Beta' }),
      ]
      const { result } = renderHook(() =>
        useThreatChartPlayerSearch(createProps({ series })),
      )

      act(() => {
        result.current.handlePlayerSearchInputKeyDown({
          key: 'ArrowDown',
          preventDefault: vi.fn(),
        } as unknown as React.KeyboardEvent<HTMLInputElement>)
      })

      expect(result.current.resolvedHighlightedPlayerId).toBe(2)
    })

    it('moves highlight up with ArrowUp', () => {
      const series = [
        createSeries({ actorId: 1, actorName: 'Alpha', label: 'Alpha' }),
        createSeries({ actorId: 2, actorName: 'Beta', label: 'Beta' }),
      ]
      const { result } = renderHook(() =>
        useThreatChartPlayerSearch(createProps({ series })),
      )

      act(() => {
        result.current.setHighlightedPlayerId(2)
      })

      act(() => {
        result.current.handlePlayerSearchInputKeyDown({
          key: 'ArrowUp',
          preventDefault: vi.fn(),
        } as unknown as React.KeyboardEvent<HTMLInputElement>)
      })

      expect(result.current.resolvedHighlightedPlayerId).toBe(1)
    })

    it('wraps around at the end of the list', () => {
      const series = [
        createSeries({ actorId: 1, actorName: 'Alpha', label: 'Alpha' }),
        createSeries({ actorId: 2, actorName: 'Beta', label: 'Beta' }),
      ]
      const { result } = renderHook(() =>
        useThreatChartPlayerSearch(createProps({ series })),
      )

      act(() => {
        result.current.setHighlightedPlayerId(2)
      })

      act(() => {
        result.current.handlePlayerSearchInputKeyDown({
          key: 'ArrowDown',
          preventDefault: vi.fn(),
        } as unknown as React.KeyboardEvent<HTMLInputElement>)
      })

      expect(result.current.resolvedHighlightedPlayerId).toBe(1)
    })

    it('closes search on Escape', () => {
      const { result } = renderHook(() =>
        useThreatChartPlayerSearch(createProps()),
      )

      act(() => {
        result.current.openPlayerSearch()
      })

      act(() => {
        result.current.handlePlayerSearchInputKeyDown({
          key: 'Escape',
          preventDefault: vi.fn(),
        } as unknown as React.KeyboardEvent<HTMLInputElement>)
      })

      expect(result.current.isPlayerSearchOpen).toBe(false)
    })

    it('selects highlighted player on Enter and closes search', () => {
      const onFocusAndIsolatePlayer = vi.fn()
      const series = [
        createSeries({ actorId: 1, actorName: 'Alpha', label: 'Alpha' }),
      ]
      const { result } = renderHook(() =>
        useThreatChartPlayerSearch(
          createProps({ series, onFocusAndIsolatePlayer }),
        ),
      )

      act(() => {
        result.current.openPlayerSearch()
      })

      act(() => {
        result.current.handlePlayerSearchInputKeyDown({
          key: 'Enter',
          shiftKey: false,
          preventDefault: vi.fn(),
        } as unknown as React.KeyboardEvent<HTMLInputElement>)
      })

      expect(onFocusAndIsolatePlayer).toHaveBeenCalledWith(1)
      expect(result.current.isPlayerSearchOpen).toBe(false)
    })

    it('adds to filter on Shift+Enter', () => {
      const onFocusAndAddPlayer = vi.fn()
      const series = [
        createSeries({ actorId: 1, actorName: 'Alpha', label: 'Alpha' }),
      ]
      const { result } = renderHook(() =>
        useThreatChartPlayerSearch(
          createProps({ series, onFocusAndAddPlayer }),
        ),
      )

      act(() => {
        result.current.openPlayerSearch()
      })

      act(() => {
        result.current.handlePlayerSearchInputKeyDown({
          key: 'Enter',
          shiftKey: true,
          preventDefault: vi.fn(),
        } as unknown as React.KeyboardEvent<HTMLInputElement>)
      })

      expect(onFocusAndAddPlayer).toHaveBeenCalledWith(1)
    })
  })

  describe('selectPlayer', () => {
    it('isolates player when shouldAddToFilter is false', () => {
      const onFocusAndIsolatePlayer = vi.fn()
      const series = [createSeries({ actorId: 1 })]
      const { result } = renderHook(() =>
        useThreatChartPlayerSearch(
          createProps({ series, onFocusAndIsolatePlayer }),
        ),
      )

      act(() => {
        result.current.selectPlayer({
          playerId: 1,
          shouldAddToFilter: false,
          selectionMethod: 'click',
        })
      })

      expect(onFocusAndIsolatePlayer).toHaveBeenCalledWith(1)
    })

    it('adds player when shouldAddToFilter is true', () => {
      const onFocusAndAddPlayer = vi.fn()
      const series = [createSeries({ actorId: 1 })]
      const { result } = renderHook(() =>
        useThreatChartPlayerSearch(
          createProps({ series, onFocusAndAddPlayer }),
        ),
      )

      act(() => {
        result.current.selectPlayer({
          playerId: 1,
          shouldAddToFilter: true,
          selectionMethod: 'keyboard',
        })
      })

      expect(onFocusAndAddPlayer).toHaveBeenCalledWith(1)
    })
  })

  describe('posthog tracking', () => {
    it('captures player_fuzzy_search_opened when search opens', () => {
      const posthog = createMockPosthog()
      const { result } = renderHook(() =>
        useThreatChartPlayerSearch(createProps({ posthog })),
      )

      act(() => {
        result.current.openPlayerSearch()
      })

      expect(posthog.capture).toHaveBeenCalledWith(
        'player_fuzzy_search_opened',
        {
          fight_id: 1,
          report_id: 'ABC123',
        },
      )
    })

    it('captures player_fuzzy_search_selected with click method on selectPlayer', () => {
      const posthog = createMockPosthog()
      const series = [createSeries({ actorId: 1 })]
      const { result } = renderHook(() =>
        useThreatChartPlayerSearch(createProps({ series, posthog })),
      )

      act(() => {
        result.current.selectPlayer({
          playerId: 1,
          shouldAddToFilter: false,
          selectionMethod: 'click',
        })
      })

      expect(posthog.capture).toHaveBeenCalledWith(
        'player_fuzzy_search_selected',
        {
          fight_id: 1,
          report_id: 'ABC123',
          player_id: 1,
          selection_method: 'click',
        },
      )
    })

    it('captures player_fuzzy_search_selected with keyboard method on Enter', () => {
      const posthog = createMockPosthog()
      const series = [createSeries({ actorId: 1 })]
      const { result } = renderHook(() =>
        useThreatChartPlayerSearch(createProps({ series, posthog })),
      )

      act(() => {
        result.current.openPlayerSearch()
      })

      act(() => {
        result.current.handlePlayerSearchInputKeyDown({
          key: 'Enter',
          shiftKey: false,
          preventDefault: vi.fn(),
        } as unknown as React.KeyboardEvent<HTMLInputElement>)
      })

      expect(posthog.capture).toHaveBeenCalledWith(
        'player_fuzzy_search_selected',
        {
          fight_id: 1,
          report_id: 'ABC123',
          player_id: 1,
          selection_method: 'keyboard',
        },
      )
    })
  })
})
