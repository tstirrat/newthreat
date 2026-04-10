/**
 * Temple of Ahn'Qiraj Abilities - Season of Discovery
 */
import type { ThreatFormula } from '@wow-threat/shared'

import { modifyThreat, modifyThreatOnHit } from '../../shared/formulas'

export const aq40Abilities: Record<number, ThreatFormula> = {
  800: modifyThreat({ modifier: 0, target: 'all', eventTypes: ['applybuff'] }), // Twin Emperors Teleport
  26102: modifyThreatOnHit(0), // Ouro Sand Blast
  26580: modifyThreatOnHit(0), // Princess Yauj Fear
  26561: modifyThreat({ modifier: 0, target: 'all', eventTypes: ['cast'] }), // Vem Berserker Charge
  11130: modifyThreatOnHit(0.5), // Qiraji Champion Knock Away
}
