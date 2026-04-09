/**
 * Click-to-place and drag-to-scrub playhead interaction for replay mode.
 */
import type ReactEChartsCore from 'echarts-for-react/esm/core'
import type { RefObject } from 'react'
import { useEffect } from 'react'

interface PointerEventLike {
  offsetX?: number
  offsetY?: number
  zrX?: number
  zrY?: number
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

/** Attach ZRender handlers for click-to-place and drag-to-scrub playhead in replay mode. */
export function useThreatChartPlayhead({
  chartRef,
  isChartReady,
  enabled,
  bounds,
  onPlayheadChange,
}: {
  chartRef: RefObject<ReactEChartsCore | null>
  isChartReady: boolean
  enabled: boolean
  bounds: { min: number; max: number }
  onPlayheadChange: (timeMs: number) => void
}): void {
  useEffect(() => {
    if (!enabled || !isChartReady) {
      return
    }

    const chart = chartRef.current?.getEchartsInstance()
    if (!chart) {
      return
    }

    const zr = chart.getZr()
    let isDragging = false

    const resolvePointer = (
      event: PointerEventLike,
    ): [number, number] | null => {
      const x = event.offsetX ?? event.zrX
      const y = event.offsetY ?? event.zrY
      if (
        x === undefined ||
        y === undefined ||
        !Number.isFinite(x) ||
        !Number.isFinite(y)
      ) {
        return null
      }

      return [x, y]
    }

    const pixelToTime = (pixelX: number): number | null => {
      const clampedX = clamp(pixelX, 0, chart.getWidth())
      const value = Number(chart.convertFromPixel({ xAxisIndex: 0 }, clampedX))
      if (!Number.isFinite(value)) {
        return null
      }

      return clamp(Math.round(value), bounds.min, bounds.max)
    }

    const handleMouseDown = (event: PointerEventLike): void => {
      const pointer = resolvePointer(event)
      if (!pointer) {
        return
      }

      const isInGrid = chart.containPixel({ gridIndex: 0 }, pointer)
      if (!isInGrid) {
        return
      }

      isDragging = true
      const timeMs = pixelToTime(pointer[0])
      if (timeMs !== null) {
        onPlayheadChange(timeMs)
      }
    }

    const handleMouseMove = (event: PointerEventLike): void => {
      if (!isDragging) {
        return
      }

      const pointer = resolvePointer(event)
      if (!pointer) {
        return
      }

      const timeMs = pixelToTime(pointer[0])
      if (timeMs !== null) {
        onPlayheadChange(timeMs)
      }
    }

    const handleMouseUp = (): void => {
      isDragging = false
    }

    const handleDocumentMouseUp = (): void => {
      isDragging = false
    }

    zr.on('mousedown', handleMouseDown)
    zr.on('mousemove', handleMouseMove)
    zr.on('mouseup', handleMouseUp)
    window.addEventListener('mouseup', handleDocumentMouseUp)

    return () => {
      zr.off('mousedown', handleMouseDown)
      zr.off('mousemove', handleMouseMove)
      zr.off('mouseup', handleMouseUp)
      window.removeEventListener('mouseup', handleDocumentMouseUp)
    }
  }, [
    bounds.max,
    bounds.min,
    chartRef,
    enabled,
    isChartReady,
    onPlayheadChange,
  ])
}
