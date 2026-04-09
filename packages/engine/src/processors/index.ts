/**
 * Built-in threat engine fight processors.
 */
import type { FightProcessorFactory } from '../event-processors'
import { createInferInitialBuffsProcessor } from './infer-initial-buffs'
import { createInferRighteousFuryProcessor } from './infer-righteous-fury'
import { createInsignificantEnemyFilterProcessor } from './insignificant-enemy-filter'
import { createMinmaxSalvationProcessor } from './minmax-salvation'
import { createPartyDetectionProcessor } from './party-detection'
import { createTranquilAirEmulationProcessor } from './tranquil-air-emulation'

export { createInferInitialBuffsProcessor } from './infer-initial-buffs'
export { createInferRighteousFuryProcessor } from './infer-righteous-fury'
export {
  createInsignificantEnemyFilterProcessor,
  significantEnemyIdsKey,
} from './insignificant-enemy-filter'
export { createMinmaxSalvationProcessor } from './minmax-salvation'
export {
  createPartyDetectionProcessor,
  partyAssignmentsKey,
  type PartyAssignments,
} from './party-detection'
export { createTranquilAirEmulationProcessor } from './tranquil-air-emulation'

/** Built-in processor factories installed by default on engine instances. */
export const defaultFightProcessorFactories: FightProcessorFactory[] = [
  createInsignificantEnemyFilterProcessor,
  createPartyDetectionProcessor,
  createTranquilAirEmulationProcessor,
  createInferInitialBuffsProcessor,
  createMinmaxSalvationProcessor,
  createInferRighteousFuryProcessor,
]
