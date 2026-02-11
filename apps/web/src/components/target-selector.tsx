/**
 * Explicit target selector control for fight charts.
 */
import type { FC } from 'react'

import type { ReportActorSummary } from '../types/api'

export type TargetSelectorProps = {
  enemies: ReportActorSummary[]
  selectedTargetId: number
  onChange: (targetId: number) => void
}

export const TargetSelector: FC<TargetSelectorProps> = ({
  enemies,
  selectedTargetId,
  onChange,
}) => {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="font-medium">Target</span>
      <select
        className="rounded-md border border-border bg-panel px-3 py-2"
        value={selectedTargetId}
        onChange={(event) => onChange(Number(event.target.value))}
      >
        {enemies.map((enemy) => (
          <option key={enemy.id} value={enemy.id}>
            {enemy.name} ({enemy.id})
          </option>
        ))}
      </select>
    </label>
  )
}
