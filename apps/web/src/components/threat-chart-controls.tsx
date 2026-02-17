/**
 * Top action controls for threat chart interactions.
 */
import type { FC } from 'react'

import { Button } from './ui/button'

export interface ThreatChartControlsProps {
  showClearIsolate: boolean
  onResetZoom: () => void
  onClearIsolate: () => void
}

export const ThreatChartControls: FC<ThreatChartControlsProps> = ({
  showClearIsolate,
  onResetZoom,
  onClearIsolate,
}) => {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button size="sm" type="button" variant="outline" onClick={onResetZoom}>
        Reset zoom
      </Button>
      {showClearIsolate ? (
        <Button
          size="sm"
          type="button"
          variant="outline"
          onClick={onClearIsolate}
        >
          Clear isolate
        </Button>
      ) : null}
    </div>
  )
}
