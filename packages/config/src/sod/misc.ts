import type { ThreatFormula } from '@wow-threat/shared'

import { threat } from '../shared/formulas'

export const miscAbilities: Record<number, ThreatFormula> = {
  467271: threat({ modifier: 2.25, eventTypes: ['damage'] }), // Dragonbreath Hand-Cannon

  1213816: threat({ modifier: 2, eventTypes: ['damage'] }), // Razorbramble
  1213813: threat({ modifier: 2, eventTypes: ['damage'] }), // Razorspike
}
