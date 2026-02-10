/**
 * Fight-level page with target/player filters and threat chart.
 */
import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'

import { ErrorState } from '../components/error-state'
import { LoadingState } from '../components/loading-state'
import { PlayerFilterPanel } from '../components/player-filter-panel'
import { PlayerSummaryTable } from '../components/player-summary-table'
import { SectionCard } from '../components/section-card'
import { TargetSelector } from '../components/target-selector'
import { ThreatChart } from '../components/threat-chart'
import {
  buildPlayerSummaryRows,
  buildThreatSeries,
  filterSeriesByPlayers,
  selectDefaultTargetId,
} from '../lib/threat-aggregation'
import { buildFightRankingsUrl, buildReportUrl } from '../lib/wcl-url'
import { useFightData } from '../hooks/use-fight-data'
import { useFightEvents } from '../hooks/use-fight-events'
import { useFightQueryState } from '../hooks/use-fight-query-state'
import { useReportData } from '../hooks/use-report-data'
import { useReportHost } from '../hooks/use-report-host'
import { useRecentReports } from '../hooks/use-recent-reports'
import type { WarcraftLogsHost } from '../types/app'

interface LocationState {
  host?: WarcraftLogsHost
}

export function FightPage(): JSX.Element {
  const params = useParams<{ reportId: string; fightId: string }>()
  const location = useLocation()
  const locationState = location.state as LocationState | null

  const reportId = params.reportId ?? ''
  const fightId = Number.parseInt(params.fightId ?? '', 10)

  const { recentReports, addRecentReport } = useRecentReports()
  const reportHost = useReportHost(reportId, recentReports)

  const reportQuery = useReportData(reportId)
  const fightQuery = useFightData(reportId, fightId)
  const eventsQuery = useFightEvents(reportId, fightId)

  useEffect(() => {
    if (!reportQuery.data) {
      return
    }

    addRecentReport({
      reportId,
      title: reportQuery.data.title,
      sourceHost: locationState?.host ?? reportHost,
      lastOpenedAt: Date.now(),
    })
  }, [addRecentReport, locationState?.host, reportHost, reportId, reportQuery.data])

  if (!reportId || Number.isNaN(fightId)) {
    return (
      <ErrorState
        message="Fight route requires both reportId and fightId."
        title="Invalid fight route"
      />
    )
  }

  if (reportQuery.isLoading || fightQuery.isLoading || eventsQuery.isLoading) {
    return <LoadingState message="Loading fight data and threat events..." />
  }

  if (reportQuery.error || !reportQuery.data) {
    return (
      <ErrorState
        message={reportQuery.error?.message ?? 'Report metadata unavailable.'}
        title="Unable to load report"
      />
    )
  }

  if (fightQuery.error || !fightQuery.data) {
    return (
      <ErrorState
        message={fightQuery.error?.message ?? 'Fight metadata unavailable.'}
        title="Unable to load fight"
      />
    )
  }

  if (eventsQuery.error || !eventsQuery.data) {
    return (
      <ErrorState
        message={eventsQuery.error?.message ?? 'Fight events unavailable.'}
        title="Unable to load threat events"
      />
    )
  }

  const reportData = reportQuery.data
  const fightData = fightQuery.data
  const eventsData = eventsQuery.data

  const players = fightData.actors.filter((actor) => actor.type === 'Player')
  const validPlayerIds = new Set(players.map((player) => player.id))
  const validTargetIds = new Set(fightData.enemies.map((enemy) => enemy.id))

  const durationMs =
    fightData.endTime - fightData.startTime > 0
      ? fightData.endTime - fightData.startTime
      : eventsData.summary.duration

  const queryState = useFightQueryState({
    validPlayerIds,
    validTargetIds,
    maxDurationMs: durationMs,
  })

  const defaultTargetId = useMemo(
    () => selectDefaultTargetId(eventsData.events, validTargetIds),
    [eventsData.events, validTargetIds],
  )

  const selectedTargetId =
    queryState.state.targetId ?? defaultTargetId ?? fightData.enemies[0]?.id ?? null

  const [isolatedActorId, setIsolatedActorId] = useState<number | null>(null)

  const allSeries = useMemo(() => {
    if (!selectedTargetId) {
      return []
    }

    return buildThreatSeries({
      events: eventsData.events,
      actors: fightData.actors,
      abilities: reportData.abilities,
      fightStartTime: fightData.startTime,
      targetId: selectedTargetId,
    })
  }, [eventsData.events, fightData.actors, fightData.startTime, reportData.abilities, selectedTargetId])

  const visibleSeries = useMemo(
    () => filterSeriesByPlayers(allSeries, queryState.state.players),
    [allSeries, queryState.state.players],
  )

  const focusedActorIds = useMemo(() => {
    if (isolatedActorId !== null) {
      return new Set([isolatedActorId])
    }

    if (queryState.state.players.length === 0) {
      return new Set<number>()
    }

    const selectedPlayers = new Set(queryState.state.players)

    return new Set(
      visibleSeries
        .filter((series) => {
          if (series.actorType === 'Player') {
            return selectedPlayers.has(series.actorId)
          }

          if (!series.ownerId) {
            return false
          }

          return selectedPlayers.has(series.ownerId)
        })
        .map((series) => series.actorId),
    )
  }, [isolatedActorId, queryState.state.players, visibleSeries])

  const summaryRows = useMemo(
    () => buildPlayerSummaryRows(visibleSeries, focusedActorIds),
    [focusedActorIds, visibleSeries],
  )

  return (
    <div className="space-y-5">
      <SectionCard
        title={`${fightData.name} (Fight #${fightData.id})`}
        subtitle={`${reportData.title} · ${fightData.kill ? 'Kill' : 'Wipe'} · ${Math.round(durationMs / 1000)}s`}
      >
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <Link className="underline" to={`/report/${reportId}`}>
            Back to report
          </Link>
          <a
            className="underline"
            href={buildReportUrl(locationState?.host ?? reportHost, reportId)}
            rel="noreferrer"
            target="_blank"
          >
            Open report on Warcraft Logs
          </a>
          <a
            className="underline"
            href={buildFightRankingsUrl(
              locationState?.host ?? reportHost,
              reportId,
              fightId,
            )}
            rel="noreferrer"
            target="_blank"
          >
            Open this fight on Warcraft Logs
          </a>
        </div>
      </SectionCard>

      <SectionCard
        title="Filters"
        subtitle="Player and target controls are synced with URL query params for deep linking."
      >
        <div className="space-y-4">
          {selectedTargetId ? (
            <TargetSelector
              enemies={fightData.enemies}
              selectedTargetId={selectedTargetId}
              onChange={(targetId) => {
                queryState.setTargetId(targetId)
                setIsolatedActorId(null)
              }}
            />
          ) : (
            <p className="text-sm text-muted">No valid targets available for this fight.</p>
          )}
          <PlayerFilterPanel
            players={players}
            selectedPlayerIds={queryState.state.players}
            onChange={(playerIds) => {
              queryState.setPlayers(playerIds)
              setIsolatedActorId(null)
            }}
          />
        </div>
      </SectionCard>

      <SectionCard
        title="Threat timeline"
        subtitle="Legend on the right. Double-click an actor label to isolate, and double-click again to restore."
      >
        {visibleSeries.length === 0 ? (
          <p className="text-sm text-muted">
            No threat points are available for this filter/target combination.
          </p>
        ) : (
          <ThreatChart
            series={visibleSeries}
            windowEndMs={queryState.state.endMs}
            windowStartMs={queryState.state.startMs}
            onIsolatedActorChange={(actorId) => setIsolatedActorId(actorId)}
            onWindowChange={(startMs, endMs) => {
              queryState.setWindow(startMs, endMs)
            }}
          />
        )}
      </SectionCard>

      <SectionCard
        title="Focused player summary"
        subtitle="Displayed for selected players or a legend-isolated actor."
      >
        <PlayerSummaryTable rows={summaryRows} />
      </SectionCard>
    </div>
  )
}
