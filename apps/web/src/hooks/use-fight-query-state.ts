/**
 * Hook for reading and updating fight deep-link query state.
 */
import { useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'

import {
  applyFightQueryState,
  resolveFightQueryState,
} from '../lib/search-params'
import type { FightQueryState } from '../types/app'

export interface UseFightQueryStateResult {
  state: FightQueryState
  setPlayers: (players: number[]) => void
  setTargetId: (targetId: number | null) => void
  setWindow: (startMs: number | null, endMs: number | null) => void
}

/** Manage fight query params with parsing + normalization rules. */
export function useFightQueryState({
  validPlayerIds,
  validTargetIds,
  maxDurationMs,
}: {
  validPlayerIds: Set<number>
  validTargetIds: Set<number>
  maxDurationMs: number
}): UseFightQueryStateResult {
  const [searchParams, setSearchParams] = useSearchParams()
  const searchParamsString = searchParams.toString()

  const state = useMemo(
    () =>
      resolveFightQueryState({
        searchParams: new URLSearchParams(searchParamsString),
        validPlayerIds,
        validTargetIds,
        maxDurationMs,
      }),
    [maxDurationMs, searchParamsString, validPlayerIds, validTargetIds],
  )

  const setPlayers = useCallback(
    (players: number[]): void => {
      setSearchParams((currentSearchParams) =>
        applyFightQueryState(currentSearchParams, { players }),
      )
    },
    [setSearchParams],
  )

  const setTargetId = useCallback(
    (targetId: number | null): void => {
      setSearchParams((currentSearchParams) =>
        applyFightQueryState(currentSearchParams, { targetId }),
      )
    },
    [setSearchParams],
  )

  const setWindow = useCallback(
    (startMs: number | null, endMs: number | null): void => {
      setSearchParams((currentSearchParams) =>
        applyFightQueryState(currentSearchParams, { startMs, endMs }),
      )
    },
    [setSearchParams],
  )

  return useMemo(
    () => ({
      state,
      setPlayers,
      setTargetId,
      setWindow,
    }),
    [setPlayers, setTargetId, setWindow, state],
  )
}
