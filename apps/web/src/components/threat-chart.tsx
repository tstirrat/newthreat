/**
 * ECharts threat timeline with deep-linkable zoom and legend isolation behavior.
 */
import { useEffect, useMemo, useRef, useState } from 'react'
import type { EChartsOption } from 'echarts'
import ReactECharts from 'echarts-for-react'

import { formatNumber, formatSeconds } from '../lib/format'
import type { ThreatSeries } from '../types/app'

interface LegendClickState {
  name: string
  timestamp: number
}

const doubleClickThresholdMs = 320

function resolveWindowBounds(series: ThreatSeries[]): { min: number; max: number } {
  const allPoints = series.flatMap((item) => item.points)
  if (allPoints.length === 0) {
    return { min: 0, max: 0 }
  }

  const times = allPoints.map((point) => point.timeMs)
  return {
    min: Math.min(...times),
    max: Math.max(...times),
  }
}

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

export function ThreatChart({
  series,
  windowStartMs,
  windowEndMs,
  onWindowChange,
  onIsolatedActorChange,
}: {
  series: ThreatSeries[]
  windowStartMs: number | null
  windowEndMs: number | null
  onWindowChange: (startMs: number | null, endMs: number | null) => void
  onIsolatedActorChange: (actorId: number | null) => void
}): JSX.Element {
  const chartRef = useRef<ReactECharts>(null)
  const lastLegendClickRef = useRef<LegendClickState | null>(null)
  const [isolatedActorId, setIsolatedActorId] = useState<number | null>(null)

  const bounds = useMemo(() => resolveWindowBounds(series), [series])

  const legendNames = useMemo(() => series.map((item) => item.label), [series])
  const actorIdByLabel = useMemo(
    () => new Map(series.map((item) => [item.label, item.actorId])),
    [series],
  )

  useEffect(() => {
    if (isolatedActorId === null) {
      return
    }

    const stillPresent = series.some((item) => item.actorId === isolatedActorId)
    if (stillPresent) {
      return
    }

    setIsolatedActorId(null)
    onIsolatedActorChange(null)
  }, [isolatedActorId, onIsolatedActorChange, series])

  const option = useMemo<EChartsOption>(() => {
    const richStyles = Object.fromEntries(
      series.map((item) => [
        `actor-${item.actorId}`,
        {
          color: item.color,
          fontWeight: 600,
        },
      ]),
    )

    const startValue = windowStartMs ?? bounds.min
    const endValue = windowEndMs ?? bounds.max

    return {
      animation: false,
      grid: {
        top: 30,
        left: 60,
        right: 250,
        bottom: 84,
      },
      legend: {
        orient: 'vertical',
        right: 8,
        top: 32,
        itemHeight: 10,
        itemWidth: 18,
        formatter: (name) => {
          const actorId = actorIdByLabel.get(name)
          if (!actorId) {
            return name
          }
          return `{actor-${actorId}|${name}}`
        },
        textStyle: {
          color: '#334155',
          rich: richStyles,
        },
      },
      tooltip: {
        trigger: 'item',
        appendToBody: true,
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
            `Time: ${formatSeconds(timeMs)}`,
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
        name: 'Fight Time (ms)',
        min: bounds.min,
        max: bounds.max,
      },
      yAxis: {
        type: 'value',
        name: 'Threat',
      },
      dataZoom: [
        {
          type: 'inside',
          xAxisIndex: 0,
          filterMode: 'none',
          startValue,
          endValue,
        },
        {
          type: 'slider',
          xAxisIndex: 0,
          filterMode: 'none',
          height: 20,
          bottom: 24,
          startValue,
          endValue,
        },
      ],
      series: series.map((item) => ({
        name: item.label,
        type: 'line',
        showSymbol: false,
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
  }, [actorIdByLabel, bounds.max, bounds.min, series, windowEndMs, windowStartMs])

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <button
          className="rounded-md border border-border bg-white px-2 py-1 text-xs"
          type="button"
          onClick={() => onWindowChange(null, null)}
        >
          Reset zoom
        </button>
        {isolatedActorId !== null ? (
          <button
            className="rounded-md border border-border bg-white px-2 py-1 text-xs"
            type="button"
            onClick={() => {
              const chart = chartRef.current?.getEchartsInstance()
              if (!chart) {
                return
              }

              resetLegendSelection(chart, legendNames)
              setIsolatedActorId(null)
              onIsolatedActorChange(null)
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
            const nextStart = Math.round(batch?.startValue ?? params.startValue ?? bounds.min)
            const nextEnd = Math.round(batch?.endValue ?? params.endValue ?? bounds.max)

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

            if (isolatedActorId === clickedActorId) {
              resetLegendSelection(chart, legendNames)
              setIsolatedActorId(null)
              onIsolatedActorChange(null)
              return
            }

            isolateLegendSelection(chart, params.name, legendNames)
            setIsolatedActorId(clickedActorId)
            onIsolatedActorChange(clickedActorId)
          },
        }}
      />
    </div>
  )
}
