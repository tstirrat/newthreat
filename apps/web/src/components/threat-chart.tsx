/**
 * ECharts threat timeline with deep-linkable zoom and legend isolation behavior.
 */
import type { EChartsOption } from 'echarts'
import ReactECharts from 'echarts-for-react'
import { type FC, useEffect, useRef, useState } from 'react'

import { formatNumber, formatTimelineTime } from '../lib/format'
import { resolveSeriesWindowBounds } from '../lib/threat-aggregation'
import type { ThreatSeries } from '../types/app'

interface LegendClickState {
  name: string
  timestamp: number
}

interface ChartThemeColors {
  border: string
  foreground: string
  muted: string
  panel: string
}

const doubleClickThresholdMs = 320

function resetLegendSelection(
  chart: ReturnType<ReactECharts['getEchartsInstance']>,
  names: string[],
): void {
  names.forEach((name) => {
    chart.dispatchAction({ type: 'legendSelect', name })
  })
}

function isolateLegendSelection(
  chart: ReturnType<ReactECharts['getEchartsInstance']>,
  isolateName: string,
  names: string[],
): void {
  names.forEach((name) => {
    chart.dispatchAction({
      type: name === isolateName ? 'legendSelect' : 'legendUnSelect',
      name,
    })
  })
}

function resolveThemeColor(variableName: string, fallback: string): string {
  if (typeof window === 'undefined') {
    return fallback
  }

  const value = getComputedStyle(document.documentElement)
    .getPropertyValue(variableName)
    .trim()
  return value || fallback
}

function readChartThemeColors(): ChartThemeColors {
  return {
    border: resolveThemeColor('--border', '#d1d5db'),
    foreground: resolveThemeColor('--foreground', '#0f172a'),
    muted: resolveThemeColor('--muted-foreground', '#64748b'),
    panel: resolveThemeColor('--card', '#ffffff'),
  }
}

export type ThreatChartProps = {
  series: ThreatSeries[]
  windowStartMs: number | null
  windowEndMs: number | null
  onWindowChange: (startMs: number | null, endMs: number | null) => void
  onSeriesClick: (playerId: number) => void
}

export const ThreatChart: FC<ThreatChartProps> = ({
  series,
  windowStartMs,
  windowEndMs,
  onWindowChange,
  onSeriesClick,
}) => {
  const chartRef = useRef<ReactECharts>(null)
  const lastLegendClickRef = useRef<LegendClickState | null>(null)
  const [isolatedActorId, setIsolatedActorId] = useState<number | null>(null)
  const [themeColors, setThemeColors] = useState<ChartThemeColors>(() =>
    readChartThemeColors(),
  )

  const bounds = resolveSeriesWindowBounds(series)
  const visibleIsolatedActorId =
    isolatedActorId !== null &&
    series.some((item) => item.actorId === isolatedActorId)
      ? isolatedActorId
      : null

  const legendNames = series.map((item) => item.label)
  const actorIdByLabel = new Map(
    series.map((item) => [item.label, item.actorId]),
  )
  const playerIdByLabel = new Map(
    series.map((item) => [
      item.label,
      item.actorType === 'Player' ? item.actorId : item.ownerId,
    ]),
  )

  useEffect(() => {
    const updateThemeColors = (): void => {
      setThemeColors(readChartThemeColors())
    }

    window.addEventListener('themechange', updateThemeColors)
    return () => {
      window.removeEventListener('themechange', updateThemeColors)
    }
  }, [])

  const startValue = windowStartMs ?? bounds.min
  const endValue = windowEndMs ?? bounds.max
  const legendWidthPx = 128
  const legendRightOffsetPx = 8

  const option: EChartsOption = {
    animation: false,
    grid: {
      top: 30,
      left: 60,
      right: legendWidthPx + legendRightOffsetPx,
      bottom: 84,
    },
    legend: {
      type: 'scroll',
      orient: 'vertical',
      right: legendRightOffsetPx,
      top: 32,
      bottom: 32,
      width: legendWidthPx,
      itemHeight: 10,
      itemWidth: 18,
      data: series.map((item) => ({
        name: item.label,
        textStyle: {
          color: item.color,
          fontWeight: 600,
        },
      })),
      textStyle: {
        color: themeColors.muted,
      },
      icon: undefined,
    },
    tooltip: {
      trigger: 'item',
      appendToBody: true,
      backgroundColor: themeColors.panel,
      borderColor: themeColors.border,
      borderWidth: 1,
      textStyle: {
        color: themeColors.foreground,
      },
      formatter: (params) => {
        const payload = (params as { data?: Record<string, unknown> }).data
        if (!payload) {
          return ''
        }

        const threat = Number(payload.totalThreat ?? 0)
        const delta = Number(payload.threatDelta ?? 0)
        const eventType = String(payload.eventType ?? 'unknown')
        const abilityName = String(payload.abilityName ?? 'Unknown ability')
        const modifiers = String(payload.modifiers ?? 'none')
        const formula = String(payload.formula ?? 'n/a')
        const timeMs = Number(payload.timeMs ?? 0)

        return [
          `<strong>${(params as { seriesName: string }).seriesName}</strong>`,
          `Time: ${formatTimelineTime(timeMs)}`,
          `Cumulative Threat: ${formatNumber(threat)}`,
          `Threat Delta: ${delta >= 0 ? '+' : ''}${formatNumber(delta)}`,
          `Event Type: ${eventType}`,
          `Ability: ${abilityName}`,
          `Active Multipliers: ${modifiers}`,
          `Formula: ${formula}`,
        ].join('<br/>')
      },
    },
    xAxis: {
      type: 'value',
      min: bounds.min,
      max: bounds.max,
      axisLabel: {
        color: themeColors.muted,
        formatter: (value: number) => formatTimelineTime(value),
      },
      axisLine: {
        lineStyle: {
          color: themeColors.border,
        },
      },
      splitLine: {
        lineStyle: {
          color: themeColors.border,
          opacity: 0.4,
        },
      },
    },
    yAxis: {
      type: 'value',
      name: 'Threat',
      nameTextStyle: {
        color: themeColors.muted,
      },
      axisLabel: {
        color: themeColors.muted,
      },
      axisLine: {
        lineStyle: {
          color: themeColors.border,
        },
      },
      splitLine: {
        lineStyle: {
          color: themeColors.border,
          opacity: 0.4,
        },
      },
    },
    dataZoom: [
      {
        type: 'inside',
        xAxisIndex: 0,
        filterMode: 'none',
        startValue,
        endValue,
        labelFormatter: (value: number) => formatTimelineTime(value),
      },
      {
        type: 'slider',
        xAxisIndex: 0,
        filterMode: 'none',
        height: 20,
        bottom: 24,
        startValue,
        endValue,
        labelFormatter: (value: number) => formatTimelineTime(value),
      },
    ],
    series: series.map((item) => ({
      name: item.label,
      type: 'line',
      color: item.color,
      showSymbol: false,
      triggerLineEvent: true,
      animation: false,
      emphasis: {
        focus: 'series',
      },
      lineStyle: {
        color: item.color,
        type: item.actorType === 'Pet' ? 'dashed' : 'solid',
        width: 2,
      },
      data: item.points.map((point) => ({
        value: [point.timeMs, point.totalThreat],
        actorId: item.actorId,
        playerId: item.actorType === 'Player' ? item.actorId : item.ownerId,
        timeMs: point.timeMs,
        totalThreat: point.totalThreat,
        threatDelta: point.threatDelta,
        eventType: point.eventType,
        abilityName: point.abilityName,
        modifiers: point.modifiers,
        formula: point.formula,
      })),
    })),
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <button
          className="rounded-md border border-border bg-panel px-2 py-1 text-xs"
          type="button"
          onClick={() => onWindowChange(null, null)}
        >
          Reset zoom
        </button>
        {visibleIsolatedActorId !== null ? (
          <button
            className="rounded-md border border-border bg-panel px-2 py-1 text-xs"
            type="button"
            onClick={() => {
              const chart = chartRef.current?.getEchartsInstance()
              if (!chart) {
                return
              }

              resetLegendSelection(chart, legendNames)
              setIsolatedActorId(null)
            }}
          >
            Clear isolate
          </button>
        ) : null}
      </div>
      <ReactECharts
        ref={chartRef}
        notMerge
        option={option}
        style={{ height: 560, width: '100%' }}
        onEvents={{
          datazoom: (params: {
            batch?: Array<{ startValue?: number; endValue?: number }>
            startValue?: number
            endValue?: number
          }) => {
            const batch = params.batch?.[0]
            const nextStart = Math.round(
              batch?.startValue ?? params.startValue ?? bounds.min,
            )
            const nextEnd = Math.round(
              batch?.endValue ?? params.endValue ?? bounds.max,
            )

            if (nextStart <= bounds.min && nextEnd >= bounds.max) {
              onWindowChange(null, null)
              return
            }

            onWindowChange(nextStart, nextEnd)
          },
          legendselectchanged: (params: {
            name: string
            selected: Record<string, boolean>
          }) => {
            const chart = chartRef.current?.getEchartsInstance()
            if (!chart) {
              return
            }

            const clickedActorId = actorIdByLabel.get(params.name)
            if (!clickedActorId) {
              return
            }

            const now = Date.now()
            const previousClick = lastLegendClickRef.current
            const isDoubleClick =
              previousClick?.name === params.name &&
              now - previousClick.timestamp <= doubleClickThresholdMs

            lastLegendClickRef.current = {
              name: params.name,
              timestamp: now,
            }

            if (!isDoubleClick) {
              return
            }

            if (visibleIsolatedActorId === clickedActorId) {
              resetLegendSelection(chart, legendNames)
              setIsolatedActorId(null)
              return
            }

            isolateLegendSelection(chart, params.name, legendNames)
            setIsolatedActorId(clickedActorId)
          },
          click: (params: {
            componentType?: string
            seriesName?: string
            data?: Record<string, unknown>
            seriesType?: string
          }) => {
            if (
              params.componentType !== 'series' ||
              params.seriesType !== 'line'
            ) {
              return
            }

            const payloadPlayerId = Number(params.data?.playerId)
            if (Number.isFinite(payloadPlayerId) && payloadPlayerId > 0) {
              onSeriesClick(payloadPlayerId)
              return
            }

            if (!params.seriesName) {
              return
            }

            const clickedPlayerId = playerIdByLabel.get(params.seriesName)
            if (!clickedPlayerId) {
              return
            }

            onSeriesClick(clickedPlayerId)
          },
        }}
      />
    </div>
  )
}
