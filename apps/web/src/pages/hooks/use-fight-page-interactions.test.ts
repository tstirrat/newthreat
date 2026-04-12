/**
 * Unit tests for fight-page interaction handler hook.
 */
import { act, renderHook } from '@testing-library/react'
import type { PostHog } from 'posthog-js'
import { describe, expect, it, vi } from 'vitest'

import type { FightQueryState } from '../../types/app'
import {
  areEqualIdLists,
  normalizeIdList,
  useFightPageInteractions,
} from './use-fight-page-interactions'

function createMockPosthog(): PostHog {
  return { capture: vi.fn() } as unknown as PostHog
}

function createQueryStateState(
  overrides: Partial<FightQueryState> = {},
): FightQueryState {
  return {
    players: [],
    pinnedPlayers: [],
    focusId: null,
    targetId: null,
    targetInstance: null,
    startMs: null,
    endMs: null,
    ...overrides,
  }
}

function createQueryState({
  state = createQueryStateState(),
}: {
  state?: FightQueryState
} = {}) {
  return {
    state,
    setFocusAndPlayers: vi.fn(),
    setFocusId: vi.fn(),
    setPinnedPlayers: vi.fn(),
    setPlayers: vi.fn(),
    setTarget: vi.fn(),
    setWindow: vi.fn(),
  }
}

const defaultInteractionsProps = {
  updateUserSettings: vi.fn().mockResolvedValue(undefined),
  validPlayerIds: new Set([1, 2, 3]),
  fightId: 1,
  reportId: 'test-report',
} as const

describe('useFightPageInteractions', () => {
  it('compares actor-id lists by value and order', () => {
    expect(areEqualIdLists([], [])).toBe(true)
    expect(areEqualIdLists([1, 2], [1, 2])).toBe(true)
    expect(areEqualIdLists([1, 2], [2, 1])).toBe(false)
    expect(areEqualIdLists([1], [1, 2])).toBe(false)
  })

  it('normalizes actor-id lists by sorting and deduplicating', () => {
    expect(normalizeIdList([2, 1, 2, 3])).toEqual([1, 2, 3])
  })

  it('maps visible players to query param players with full-list collapse', () => {
    const queryState = createQueryState({
      state: createQueryStateState({ players: [2, 1] }),
    })

    const { result } = renderHook(() =>
      useFightPageInteractions({
        ...defaultInteractionsProps,
        queryState,
      }),
    )

    act(() => {
      result.current.handleVisiblePlayerIdsChange([1, 2, 3])
    })
    expect(queryState.setPlayers).toHaveBeenCalledWith([])

    act(() => {
      result.current.handleVisiblePlayerIdsChange([1, 2])
    })
    expect(queryState.setPlayers).toHaveBeenCalledTimes(1)

    act(() => {
      result.current.handleVisiblePlayerIdsChange([1])
    })
    expect(queryState.setPlayers).toHaveBeenCalledWith([1])
  })

  it('updates visible players without mutating pinned players', () => {
    const queryState = createQueryState({
      state: createQueryStateState({ pinnedPlayers: [3, 1], players: [1, 3] }),
    })

    const { result } = renderHook(() =>
      useFightPageInteractions({
        ...defaultInteractionsProps,
        queryState,
      }),
    )

    act(() => {
      result.current.handleVisiblePlayerIdsChange([1, 2])
    })

    expect(queryState.setPlayers).toHaveBeenCalledWith([1, 2])
    expect(queryState.setPinnedPlayers).not.toHaveBeenCalled()
  })

  it('adds focused player to current filtered players list', () => {
    const queryState = createQueryState({
      state: createQueryStateState({ players: [1] }),
    })

    const { result } = renderHook(() =>
      useFightPageInteractions({
        ...defaultInteractionsProps,
        queryState,
      }),
    )

    act(() => {
      result.current.handleFocusAndAddPlayer(2)
    })

    expect(queryState.setFocusAndPlayers).toHaveBeenCalledWith(2, [1, 2])
  })

  it('keeps all players visible when adding from unfiltered state', () => {
    const queryState = createQueryState({
      state: createQueryStateState({ players: [] }),
    })

    const { result } = renderHook(() =>
      useFightPageInteractions({
        ...defaultInteractionsProps,
        queryState,
      }),
    )

    act(() => {
      result.current.handleFocusAndAddPlayer(2)
    })

    expect(queryState.setFocusAndPlayers).toHaveBeenCalledWith(2, [])
  })

  it('toggles focused-player isolation back to previous filtered players', () => {
    const queryState = createQueryState({
      state: createQueryStateState({ players: [1, 2] }),
    })

    const { result } = renderHook(() =>
      useFightPageInteractions({
        ...defaultInteractionsProps,
        queryState,
      }),
    )

    act(() => {
      result.current.handleToggleFocusedPlayerIsolation(2)
    })
    expect(queryState.setFocusAndPlayers).toHaveBeenCalledWith(2, [2])

    queryState.state = createQueryStateState({ players: [2] })

    act(() => {
      result.current.handleToggleFocusedPlayerIsolation(2)
    })
    expect(queryState.setFocusAndPlayers).toHaveBeenLastCalledWith(2, [1, 2])
  })

  it('restores no-filter state when toggling from an unfiltered view', () => {
    const queryState = createQueryState({
      state: createQueryStateState({ players: [] }),
    })

    const { result } = renderHook(() =>
      useFightPageInteractions({
        ...defaultInteractionsProps,
        queryState,
      }),
    )

    act(() => {
      result.current.handleToggleFocusedPlayerIsolation(2)
    })
    expect(queryState.setFocusAndPlayers).toHaveBeenCalledWith(2, [2])

    queryState.state = createQueryStateState({ players: [2] })

    act(() => {
      result.current.handleToggleFocusedPlayerIsolation(2)
    })
    expect(queryState.setFocusAndPlayers).toHaveBeenLastCalledWith(2, [])
  })

  it('assumes no-filter as previous state when focused player is already isolated', () => {
    const queryState = createQueryState({
      state: createQueryStateState({ players: [2], focusId: 2 }),
    })

    const { result } = renderHook(() =>
      useFightPageInteractions({
        ...defaultInteractionsProps,
        queryState,
      }),
    )

    act(() => {
      result.current.handleToggleFocusedPlayerIsolation(2)
    })

    expect(queryState.setFocusAndPlayers).toHaveBeenCalledWith(2, [])
  })

  it('forwards chart and settings interactions to query state and settings updates', () => {
    const queryState = createQueryState()
    const updateUserSettings = vi.fn().mockResolvedValue(undefined)

    const { result } = renderHook(() =>
      useFightPageInteractions({
        ...defaultInteractionsProps,
        queryState,
        updateUserSettings,
      }),
    )

    act(() => {
      result.current.handleTargetChange({ id: 99, instance: 2 })
      result.current.handleSeriesClick(7)
      result.current.handleFocusAndIsolatePlayer(1)
      result.current.handleClearSelections()
      result.current.handleTogglePinnedPlayer(1)
      result.current.handleWindowChange(1000, 5000)
      result.current.handleShowPetsChange(true)
      result.current.handleShowEnergizeEventsChange(true)
      result.current.handleShowFixateBandsChange(false)
      result.current.handleBossDamageModeChange('all')
      result.current.handleInferThreatReductionChange(true)
    })

    expect(queryState.setTarget).toHaveBeenCalledWith({ id: 99, instance: 2 })
    expect(queryState.setFocusId).toHaveBeenCalledWith(7)
    expect(queryState.setFocusAndPlayers).toHaveBeenCalledWith(1, [1])
    expect(queryState.setPlayers).toHaveBeenCalledWith([])
    expect(queryState.setPinnedPlayers).toHaveBeenCalledWith([1])
    expect(queryState.setWindow).toHaveBeenCalledWith(1000, 5000)
    expect(updateUserSettings).toHaveBeenNthCalledWith(1, { showPets: true })
    expect(updateUserSettings).toHaveBeenNthCalledWith(2, {
      showEnergizeEvents: true,
    })
    expect(updateUserSettings).toHaveBeenNthCalledWith(3, {
      showFixateBands: false,
    })
    expect(updateUserSettings).toHaveBeenNthCalledWith(4, {
      showBossMelee: true,
      showAllBossDamageEvents: true,
    })
    expect(updateUserSettings).toHaveBeenNthCalledWith(5, {
      inferThreatReduction: true,
    })
  })

  it('unpins players without mutating players query when no pins remain', () => {
    const queryState = createQueryState({
      state: createQueryStateState({ pinnedPlayers: [2], players: [2] }),
    })

    const { result } = renderHook(() =>
      useFightPageInteractions({
        ...defaultInteractionsProps,
        queryState,
      }),
    )

    act(() => {
      result.current.handleTogglePinnedPlayer(2)
    })

    expect(queryState.setPinnedPlayers).toHaveBeenCalledWith([])
    expect(queryState.setPlayers).not.toHaveBeenCalled()
  })

  describe('posthog tracking', () => {
    it('captures player_focused on series click', () => {
      const posthog = createMockPosthog()
      const queryState = createQueryState()

      const { result } = renderHook(() =>
        useFightPageInteractions({
          ...defaultInteractionsProps,
          queryState,
          posthog,
        }),
      )

      act(() => {
        result.current.handleSeriesClick(1)
      })

      expect(posthog.capture).toHaveBeenCalledWith('player_focused', {
        fight_id: 1,
        report_id: 'test-report',
      })
    })

    it('captures player_pinned on pin toggle', () => {
      const posthog = createMockPosthog()
      const queryState = createQueryState()

      const { result } = renderHook(() =>
        useFightPageInteractions({
          ...defaultInteractionsProps,
          queryState,
          posthog,
        }),
      )

      act(() => {
        result.current.handleTogglePinnedPlayer(1)
      })

      expect(posthog.capture).toHaveBeenCalledWith('player_pinned', {
        fight_id: 1,
        report_id: 'test-report',
      })
    })

    it('captures player_filtered when visible player set changes', () => {
      const posthog = createMockPosthog()
      const queryState = createQueryState()

      const { result } = renderHook(() =>
        useFightPageInteractions({
          ...defaultInteractionsProps,
          queryState,
          posthog,
        }),
      )

      act(() => {
        result.current.handleVisiblePlayerIdsChange([1, 2])
      })

      expect(posthog.capture).toHaveBeenCalledWith('player_filtered', {
        fight_id: 1,
        report_id: 'test-report',
      })
    })

    it('captures energize_events_toggled with enabled state', () => {
      const posthog = createMockPosthog()
      const queryState = createQueryState()

      const { result } = renderHook(() =>
        useFightPageInteractions({
          ...defaultInteractionsProps,
          queryState,
          posthog,
        }),
      )

      act(() => {
        result.current.handleShowEnergizeEventsChange(true)
      })

      expect(posthog.capture).toHaveBeenCalledWith('energize_events_toggled', {
        fight_id: 1,
        report_id: 'test-report',
        enabled: true,
      })
    })

    it('captures boss_damage_mode_changed with mode', () => {
      const posthog = createMockPosthog()
      const queryState = createQueryState()

      const { result } = renderHook(() =>
        useFightPageInteractions({
          ...defaultInteractionsProps,
          queryState,
          posthog,
        }),
      )

      act(() => {
        result.current.handleBossDamageModeChange('melee')
      })

      expect(posthog.capture).toHaveBeenCalledWith('boss_damage_mode_changed', {
        fight_id: 1,
        report_id: 'test-report',
        mode: 'melee',
      })
    })

    it('captures infer_threat_reduction_toggled with enabled state', () => {
      const posthog = createMockPosthog()
      const queryState = createQueryState()

      const { result } = renderHook(() =>
        useFightPageInteractions({
          ...defaultInteractionsProps,
          queryState,
          posthog,
        }),
      )

      act(() => {
        result.current.handleInferThreatReductionChange(false)
      })

      expect(posthog.capture).toHaveBeenCalledWith(
        'infer_threat_reduction_toggled',
        {
          fight_id: 1,
          report_id: 'test-report',
          enabled: false,
        },
      )
    })
  })
})
