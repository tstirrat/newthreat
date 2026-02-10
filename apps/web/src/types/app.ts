/**
 * Shared frontend app-level types.
 */
import type { PlayerClass } from '@wcl-threat/wcl-types'

export type WarcraftLogsHost =
  | 'fresh.warcraftlogs.com'
  | 'sod.warcraftlogs.com'
  | 'vanilla.warcraftlogs.com'

export interface RecentReportEntry {
  reportId: string
  title: string
  sourceHost: WarcraftLogsHost
  lastOpenedAt: number
}

export interface ExampleReportLink {
  label: string
  reportId: string
  host: WarcraftLogsHost
  href: string
}

export interface FightQueryState {
  players: number[]
  targetId: number | null
  startMs: number | null
  endMs: number | null
}

export interface ThreatPoint {
  timestamp: number
  timeMs: number
  totalThreat: number
  threatDelta: number
  eventType: string
  abilityName: string
  formula: string
  modifiers: string
}

export interface ThreatSeries {
  actorId: number
  actorName: string
  actorClass: PlayerClass | null
  actorType: 'Player' | 'Pet'
  ownerId: number | null
  label: string
  color: string
  points: ThreatPoint[]
  maxThreat: number
  totalThreat: number
  totalDamage: number
  totalHealing: number
}

export interface PlayerSummaryRow {
  actorId: number
  label: string
  actorClass: PlayerClass | null
  totalThreat: number
  totalDamage: number
  totalHealing: number
  color: string
}
