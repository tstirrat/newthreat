/**
 * Hook for reading and updating fight deep-link query state.
 */
import { useMemo } from 'react'
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

  const state = useMemo(
    () =>
      resolveFightQueryState({
        searchParams,
        validPlayerIds,
        validTargetIds,
        maxDurationMs,
      }),
    [maxDurationMs, searchParams, validPlayerIds, validTargetIds],
  )

  const setPlayers = (players: number[]): void => {
    setSearchParams(applyFightQueryState(searchParams, { players }))
  }

  const setTargetId = (targetId: number | null): void => {
    setSearchParams(applyFightQueryState(searchParams, { targetId }))
  }

  const setWindow = (startMs: number | null, endMs: number | null): void => {
    setSearchParams(applyFightQueryState(searchParams, { startMs, endMs }))
  }

  return {
    state,
    setPlayers,
    setTargetId,
    setWindow,
  }
}
