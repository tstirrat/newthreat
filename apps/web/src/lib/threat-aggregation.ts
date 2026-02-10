/**
 * Threat data transformation helpers for report rankings and fight chart series.
 */
import type { PlayerClass } from '@wcl-threat/wcl-types'

import { getActorColor, getClassColor } from './class-colors'
import type {
  AugmentedEventsResponse,
  ReportAbilitySummary,
  ReportActorSummary,
} from '../types/api'
import type { PlayerSummaryRow, ThreatSeries } from '../types/app'

const trackableActorTypes = new Set(['Player', 'Pet'])

interface SeriesAccumulator {
  actorId: number
  actorName: string
  actorClass: PlayerClass | null
  actorType: 'Player' | 'Pet'
  ownerId: number | null
  label: string
  color: string
  points: ThreatSeries['points']
  maxThreat: number
  totalThreat: number
  totalDamage: number
  totalHealing: number
}

export interface ReportPlayerRanking {
  actorId: number
  actorName: string
  actorClass: PlayerClass | null
  color: string
  totalThreat: number
  fightCount: number
  perFight: Record<number, number>
}

function resolveActorClass(
  actor: ReportActorSummary,
  actorsById: Map<number, ReportActorSummary>,
): PlayerClass | null {
  if (actor.type === 'Player') {
    return (actor.subType as PlayerClass | undefined) ?? null
  }

  if (actor.type === 'Pet' && actor.petOwner) {
    const owner = actorsById.get(actor.petOwner)
    if (owner?.type === 'Player') {
      return (owner.subType as PlayerClass | undefined) ?? null
    }
  }

  return null
}

function buildActorLabel(
  actor: ReportActorSummary,
  actorsById: Map<number, ReportActorSummary>,
): string {
  if (actor.type === 'Pet' && actor.petOwner) {
    const owner = actorsById.get(actor.petOwner)
    if (owner) {
      return `${actor.name} (${owner.name})`
    }
  }

  return actor.name
}

function formatModifiers(
  modifiers: Array<{ name: string; value: number }> | undefined,
): string {
  if (!modifiers?.length) {
    return 'none'
  }

  return modifiers
    .map((modifier) => `${modifier.name} x${modifier.value.toFixed(2)}`)
    .join(', ')
}

function createAbilityMap(
  abilities: ReportAbilitySummary[],
): Map<number, ReportAbilitySummary> {
  return new Map(
    abilities
      .filter((ability) => ability.gameID !== null)
      .map((ability) => [ability.gameID as number, ability]),
  )
}

function resolveRelativeTimeMs(
  timestamp: number,
  fightStartTime: number,
  firstTimestamp: number,
): number {
  const byFightStart = timestamp - fightStartTime
  if (byFightStart >= 0) {
    return byFightStart
  }

  return Math.max(0, timestamp - firstTimestamp)
}

/** Pick default target by highest accumulated threat in the fight. */
export function selectDefaultTargetId(
  events: AugmentedEventsResponse['events'],
  validTargetIds: Set<number>,
): number | null {
  if (validTargetIds.size === 0) {
    return null
  }

  const sourceTargetState = new Map<string, number>()
  const targetTotals = new Map<number, number>()

  events.forEach((event) => {
    event.threat.changes?.forEach((change) => {
      if (!validTargetIds.has(change.targetId)) {
        return
      }

      const sourceTargetKey = `${change.sourceId}:${change.targetId}:${change.targetInstance}`
      const previous = sourceTargetState.get(sourceTargetKey) ?? 0
      const next = change.total
      sourceTargetState.set(sourceTargetKey, next)

      const runningTotal = targetTotals.get(change.targetId) ?? 0
      targetTotals.set(change.targetId, runningTotal + (next - previous))
    })
  })

  const sorted = [...targetTotals.entries()].sort((a, b) => b[1] - a[1])
  return sorted[0]?.[0] ?? [...validTargetIds][0] ?? null
}

/** Build chartable threat series for a target from augmented events. */
export function buildThreatSeries({
  events,
  actors,
  abilities,
  fightStartTime,
  targetId,
}: {
  events: AugmentedEventsResponse['events']
  actors: ReportActorSummary[]
  abilities: ReportAbilitySummary[]
  fightStartTime: number
  targetId: number
}): ThreatSeries[] {
  const actorsById = new Map(actors.map((actor) => [actor.id, actor]))
  const abilityById = createAbilityMap(abilities)
  const sortedEvents = [...events].sort((a, b) => a.timestamp - b.timestamp)
  const firstTimestamp = sortedEvents[0]?.timestamp ?? fightStartTime

  const accumulators = new Map<number, SeriesAccumulator>()

  actors
    .filter((actor) => trackableActorTypes.has(actor.type))
    .forEach((actor) => {
      accumulators.set(actor.id, {
        actorId: actor.id,
        actorName: actor.name,
        actorClass: resolveActorClass(actor, actorsById),
        actorType: actor.type as 'Player' | 'Pet',
        ownerId: actor.type === 'Pet' ? actor.petOwner ?? null : null,
        label: buildActorLabel(actor, actorsById),
        color: getActorColor(actor, actorsById),
        points: [],
        maxThreat: 0,
        totalThreat: 0,
        totalDamage: 0,
        totalHealing: 0,
      })
    })

  sortedEvents.forEach((event) => {
    const abilityId = event.abilityGameID ?? null
    const abilityName =
      abilityId !== null
        ? (abilityById.get(abilityId)?.name ?? `Ability #${abilityId}`)
        : 'Unknown ability'
    const formula = event.threat.calculation.formula
    const modifiers = formatModifiers(event.threat.calculation.modifiers)
    const timeMs = resolveRelativeTimeMs(event.timestamp, fightStartTime, firstTimestamp)
    const damageDone = event.type === 'damage' ? Math.max(0, event.amount ?? 0) : 0
    const healingDone = event.type === 'heal' ? Math.max(0, event.amount ?? 0) : 0

    event.threat.changes?.forEach((change) => {
      if (change.targetId !== targetId) {
        return
      }

      const accumulator = accumulators.get(change.sourceId)
      if (!accumulator) {
        return
      }

      accumulator.totalThreat = change.total
      accumulator.maxThreat = Math.max(accumulator.maxThreat, change.total)
      accumulator.totalDamage += damageDone
      accumulator.totalHealing += healingDone

      accumulator.points.push({
        timestamp: event.timestamp,
        timeMs,
        totalThreat: change.total,
        threatDelta: change.amount,
        eventType: event.type,
        abilityName,
        formula,
        modifiers,
      })
    })
  })

  return [...accumulators.values()]
    .filter((series) => series.points.length > 0)
    .sort((a, b) => b.maxThreat - a.maxThreat)
}

/** Filter visible chart series based on selected player IDs. */
export function filterSeriesByPlayers(
  allSeries: ThreatSeries[],
  selectedPlayerIds: number[],
): ThreatSeries[] {
  if (selectedPlayerIds.length === 0) {
    return allSeries
  }

  const selected = new Set(selectedPlayerIds)

  return allSeries.filter((series) => {
    if (series.actorType === 'Player') {
      return selected.has(series.actorId)
    }

    if (!series.ownerId) {
      return false
    }

    return selected.has(series.ownerId)
  })
}

/** Build summary rows for selected/focused players and pets. */
export function buildPlayerSummaryRows(
  series: ThreatSeries[],
  focusedActorIds: Set<number>,
): PlayerSummaryRow[] {
  return series
    .filter((item) => focusedActorIds.has(item.actorId))
    .map((item) => ({
      actorId: item.actorId,
      label: item.label,
      actorClass: item.actorClass,
      totalThreat: item.totalThreat,
      totalDamage: item.totalDamage,
      totalHealing: item.totalHealing,
      color: item.color,
    }))
    .sort((a, b) => b.totalThreat - a.totalThreat)
}

function resolveRankingOwnerId(actor: ReportActorSummary): number | null {
  if (actor.type === 'Player') {
    return actor.id
  }

  if (actor.type === 'Pet' && actor.petOwner) {
    return actor.petOwner
  }

  return null
}

/** Build report-level ranking rows aggregated across all fights. */
export function buildReportRankings({
  fights,
  actors,
}: {
  fights: Array<{ fightId: number; events: AugmentedEventsResponse['events'] }>
  actors: ReportActorSummary[]
}): ReportPlayerRanking[] {
  const actorsById = new Map(actors.map((actor) => [actor.id, actor]))
  const ranking = new Map<number, ReportPlayerRanking>()

  fights.forEach(({ fightId, events }) => {
    const fightTotals = new Map<number, number>()

    events.forEach((event) => {
      event.threat.changes?.forEach((change) => {
        const source = actorsById.get(change.sourceId)
        if (!source) {
          return
        }

        const ownerId = resolveRankingOwnerId(source)
        if (!ownerId) {
          return
        }

        const current = fightTotals.get(ownerId) ?? 0
        fightTotals.set(ownerId, current + change.amount)
      })
    })

    fightTotals.forEach((fightThreat, ownerId) => {
      const owner = actorsById.get(ownerId)
      if (!owner || owner.type !== 'Player') {
        return
      }

      const existing = ranking.get(ownerId)
      const ownerClass = (owner.subType as PlayerClass | undefined) ?? null
      const color = getClassColor(ownerClass)

      if (existing) {
        existing.totalThreat += fightThreat
        existing.perFight[fightId] = fightThreat
        existing.fightCount = Object.keys(existing.perFight).length
        return
      }

      ranking.set(ownerId, {
        actorId: ownerId,
        actorName: owner.name,
        actorClass: ownerClass,
        color,
        totalThreat: fightThreat,
        fightCount: 1,
        perFight: {
          [fightId]: fightThreat,
        },
      })
    })
  })

  return [...ranking.values()].sort((a, b) => b.totalThreat - a.totalThreat)
}
