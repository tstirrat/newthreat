/**
 * Display initial auras from combatant info events.
 */
import type { FC } from 'react'

import type { InitialAuraDisplay } from '../types/app'

export type InitialAurasProps = {
  auras: InitialAuraDisplay[]
}

function buildWowheadUrl(spellId: number): string {
  return `https://www.wowhead.com/classic/spell=${spellId}`
}

export const InitialAuras: FC<InitialAurasProps> = ({ auras }) => {
  if (auras.length === 0) {
    return null
  }

  return (
    <div className="space-y-1">
      <div className="text-xs uppercase tracking-wide text-muted">
        Initial auras
      </div>
      <div className="flex flex-wrap gap-1">
        {auras.map((aura, index) => (
          <a
            key={`${aura.spellId}-${index}`}
            data-wowhead={`spell=${aura.spellId}&domain=classic`}
            href={buildWowheadUrl(aura.spellId)}
            target="_blank"
            rel="noreferrer"
            className={`inline-flex items-center gap-1 rounded px-2 py-1 text-xs hover:bg-black/20 ${
              aura.isNotable ? 'bg-yellow-950/40' : 'bg-black/10'
            }`}
            title={`${aura.name}${aura.stacks > 1 ? ` (${aura.stacks})` : ''}`}
          >
            <span>{aura.name}</span>
            {aura.stacks > 1 && (
              <span className="text-muted">×{aura.stacks}</span>
            )}
          </a>
        ))}
      </div>
    </div>
  )
}
