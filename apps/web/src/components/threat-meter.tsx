/**
 * Ranked threat bar chart shown in the right panel during replay mode.
 */
import { ChevronDown, ChevronUp } from 'lucide-react'
import type { FC } from 'react'

import { formatNumber, formatTimelineTime } from '../lib/format'
import type { ThreatAtTimeEntry } from '../lib/threat-at-time'
import { Button } from './ui/button'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { ScrollArea } from './ui/scroll-area'

const DEFAULT_VISIBLE_COUNT = 10

export type ThreatMeterProps = {
  entries: ThreatAtTimeEntry[]
  focusedActorId: number | null
  selectedPlayerIds: number[]
  playheadMs: number
  isExpanded: boolean
  onExpandedChange: (expanded: boolean) => void
}

/** Ranked horizontal bar chart of threat values at the current playhead timestamp. */
export const ThreatMeter: FC<ThreatMeterProps> = ({
  entries,
  focusedActorId,
  selectedPlayerIds,
  playheadMs,
  isExpanded,
  onExpandedChange,
}) => {
  const sorted = entries
    .filter((entry) => entry.threat > 0)
    .sort((a, b) => b.threat - a.threat)

  const maxThreat = sorted[0]?.threat ?? 0
  const hasFilters = selectedPlayerIds.length > 0
  const visibleEntries = isExpanded
    ? sorted
    : sorted.slice(0, DEFAULT_VISIBLE_COUNT)
  const hasMore = sorted.length > DEFAULT_VISIBLE_COUNT

  return (
    <Card
      className="min-h-0 max-h-[560px] bg-panel"
      data-size="sm"
      data-testid="threat-meter"
    >
      <CardHeader>
        <CardTitle className="text-xs">
          Threat Meter
          <span className="ml-2 text-muted-foreground font-normal">
            {formatTimelineTime(playheadMs)}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex min-h-0 flex-col gap-1 px-2 pb-2">
        <ScrollArea className="min-h-0 flex-1">
          <ul className="space-y-0.5" role="list">
            {visibleEntries.map((entry) => {
              const isFocused = entry.actorId === focusedActorId
              const isFiltered =
                hasFilters && !selectedPlayerIds.includes(entry.actorId)
              const widthPercent =
                maxThreat > 0 ? (entry.threat / maxThreat) * 100 : 0

              return (
                <li
                  key={entry.actorId}
                  className={`flex items-center gap-1.5 rounded px-1 py-0.5 ${isFiltered ? 'opacity-40' : ''}`}
                >
                  <span
                    className="w-16 shrink-0 truncate text-[10px] font-medium"
                    style={{ color: entry.color }}
                    title={entry.actorName}
                  >
                    {entry.actorName}
                  </span>
                  <div className="relative flex-1 h-3.5">
                    <div
                      className={`absolute inset-y-0 left-0 rounded-sm ${isFocused ? 'ring-2 ring-yellow-400' : ''}`}
                      style={{
                        width: `${widthPercent}%`,
                        backgroundColor: entry.color,
                        opacity: 0.7,
                      }}
                    />
                  </div>
                  <span className="w-12 shrink-0 text-right text-[10px] text-muted-foreground tabular-nums">
                    {formatNumber(entry.threat)}
                  </span>
                </li>
              )
            })}
          </ul>
          {sorted.length === 0 ? (
            <p className="px-1 py-2 text-[10px] text-muted-foreground">
              No threat at this time.
            </p>
          ) : null}
        </ScrollArea>
        {hasMore ? (
          <Button
            variant="ghost"
            size="xs"
            className="w-full text-[10px]"
            onClick={() => {
              onExpandedChange(!isExpanded)
            }}
          >
            {isExpanded ? (
              <>
                <ChevronUp className="mr-1 h-3 w-3" />
                Show top {DEFAULT_VISIBLE_COUNT}
              </>
            ) : (
              <>
                <ChevronDown className="mr-1 h-3 w-3" />
                Show all ({sorted.length})
              </>
            )}
          </Button>
        ) : null}
      </CardContent>
    </Card>
  )
}
