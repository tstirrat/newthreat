/**
 * Explicit target selector control for fight charts.
 */
import { type FC, useId } from 'react'

import type { FightTarget, FightTargetOption } from '../types/app'
import { Label } from './ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select'

export type TargetSelectorProps = {
  targets: FightTargetOption[]
  selectedTarget: FightTarget
  onChange: (target: FightTarget) => void
}

export const TargetSelector: FC<TargetSelectorProps> = ({
  targets,
  selectedTarget,
  onChange,
}) => {
  const selectId = useId()
  const selectedValue = `${selectedTarget.id}:${selectedTarget.instance}`

  return (
    <div className="flex items-center gap-2 text-sm">
      <Label htmlFor={selectId}>Target</Label>
      <Select
        value={selectedValue}
        onValueChange={(value) => {
          const [idRaw, instanceRaw] = value.split(':')
          onChange({
            id: Number(idRaw),
            instance: Number(instanceRaw),
          })
        }}
      >
        <SelectTrigger className="w-[240px]" id={selectId}>
          <SelectValue placeholder="Select target" />
        </SelectTrigger>
        <SelectContent>
          {targets.map((target) => (
            <SelectItem key={target.key} value={target.key}>
              {target.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
