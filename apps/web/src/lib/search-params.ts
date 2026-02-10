/**
 * Query parameter parsing and serialization helpers.
 */
import type { FightQueryState } from '../types/app'

function parseInteger(value: string | null): number | null {
  if (!value) {
    return null
  }

  const parsed = Number.parseInt(value, 10)
  return Number.isFinite(parsed) ? parsed : null
}

/** Parse comma-separated player IDs from query params. */
export function parsePlayersParam(raw: string | null): number[] {
  if (!raw) {
    return []
  }

  return raw
    .split(',')
    .map((part) => Number.parseInt(part.trim(), 10))
    .filter((id) => Number.isFinite(id))
}

/** Parse a target ID and ensure it exists in the valid target set. */
export function parseTargetIdParam(
  raw: string | null,
  validTargetIds: Set<number>,
): number | null {
  const parsed = parseInteger(raw)
  if (!parsed || !validTargetIds.has(parsed)) {
    return null
  }

  return parsed
}

/** Parse and validate a chart window from query params. */
export function parseWindowParams(
  startRaw: string | null,
  endRaw: string | null,
  maxDurationMs: number,
): { startMs: number | null; endMs: number | null } {
  const startMs = parseInteger(startRaw)
  const endMs = parseInteger(endRaw)

  if (startMs === null || endMs === null) {
    return { startMs: null, endMs: null }
  }

  if (startMs < 0 || endMs <= 0 || startMs >= endMs || endMs > maxDurationMs) {
    return { startMs: null, endMs: null }
  }

  return { startMs, endMs }
}

/** Normalize a fight query state against current valid players and targets. */
export function resolveFightQueryState({
  searchParams,
  validPlayerIds,
  validTargetIds,
  maxDurationMs,
}: {
  searchParams: URLSearchParams
  validPlayerIds: Set<number>
  validTargetIds: Set<number>
  maxDurationMs: number
}): FightQueryState {
  const players = parsePlayersParam(searchParams.get('players')).filter((id) =>
    validPlayerIds.has(id),
  )
  const targetId = parseTargetIdParam(searchParams.get('targetId'), validTargetIds)
  const { startMs, endMs } = parseWindowParams(
    searchParams.get('startMs'),
    searchParams.get('endMs'),
    maxDurationMs,
  )

  return {
    players,
    targetId,
    startMs,
    endMs,
  }
}

/** Write a fight query state back to URLSearchParams. */
export function applyFightQueryState(
  current: URLSearchParams,
  state: Partial<FightQueryState>,
): URLSearchParams {
  const next = new URLSearchParams(current)

  if (state.players !== undefined) {
    if (state.players.length === 0) {
      next.delete('players')
    } else {
      next.set('players', state.players.join(','))
    }
  }

  if (state.targetId !== undefined) {
    if (state.targetId === null) {
      next.delete('targetId')
    } else {
      next.set('targetId', String(state.targetId))
    }
  }

  if (state.startMs !== undefined || state.endMs !== undefined) {
    if (state.startMs === null || state.endMs === null) {
      next.delete('startMs')
      next.delete('endMs')
    } else {
      next.set('startMs', String(state.startMs))
      next.set('endMs', String(state.endMs))
    }
  }

  return next
}
