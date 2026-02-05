/**
 * Threat Calculation Service
 *
 * Orchestrates threat calculations by applying configs to WCL events.
 */

import type { WCLEvent } from '@wcl-threat/wcl-types'
import {
  type ThreatConfig,
  type ThreatContext,
  type ThreatResult,
  type ThreatModifier,
  type ClassThreatConfig,
  type WowClass,
  type Actor,
  type Enemy,
  type ActorContext,
  getActiveModifiers,
  getTotalMultiplier,
  type ThreatCalculation,
} from '@wcl-threat/threat-config'

export interface CalculateThreatOptions {
  sourceAuras: Set<number>
  targetAuras: Set<number>
  enemies: Enemy[] // Still needed for building threat values
  sourceActor: Actor
  targetActor: Actor
  encounterId: number | null
  actors: ActorContext // NEW: Actor state accessors
}

/**
 * Calculate threat with modifications
 */
export function calculateModifiedThreat(
  event: WCLEvent,
  options: CalculateThreatOptions,
  config: ThreatConfig
): ThreatCalculation {
  const amount = getEventAmount(event)

  const ctx: ThreatContext = {
    event,
    amount,
    sourceAuras: options.sourceAuras,
    targetAuras: options.targetAuras,
    sourceActor: options.sourceActor,
    targetActor: options.targetActor,
    encounterId: options.encounterId,
    actors: options.actors, // NEW: Actor context
  }

  // Get the threat formula result
  const formulaResult = getFormulaResult(ctx, config)

  // Collect all modifiers (no longer from formula result)
  const allModifiers: ThreatModifier[] = [
    ...getClassModifiers(options.sourceActor.class, config),
    ...getAuraModifiers(ctx, config),
  ]

  // Calculate total multiplier
  const totalMultiplier = getTotalMultiplier(allModifiers)
  const modifiedThreat = formulaResult.value * totalMultiplier

  return {
    formula: formulaResult.formula,
    amount: amount,
    baseThreat: formulaResult.value,
    modifiedThreat: modifiedThreat,
    isSplit: formulaResult.splitAmongEnemies,
    modifiers: allModifiers,
    special: formulaResult.special, // NEW: Include special behaviors
  }
}

/**
 * Calculate threat modification: multiply current threat by multiplier, floor at 0
 */
export function calculateThreatModification(
  currentThreat: number,
  multiplier: number
): number {
  return Math.max(0, currentThreat * multiplier)
}

/**
 * Get the relevant amount from an event (damage, heal, etc.)
 */
function getEventAmount(event: WCLEvent): number {
  switch (event.type) {
    case 'damage':
      return event.amount
    case 'heal': {
      // Only effective healing generates threat (exclude overheal)
      const overheal = 'overheal' in event ? event.overheal : 0
      return Math.max(0, event.amount - overheal)
    }
    case 'energize':
      // Only actual resource gained generates threat (exclude waste)
      return Math.max(0, event.resourceChange - event.waste)
    default:
      return 0
  }
}

/**
 * Get the formula result for an event
 */
function getFormulaResult(ctx: ThreatContext, config: ThreatConfig) {
  const event = ctx.event

  // Merge abilities: global first, then class (class overrides global on duplicates)
  if ('abilityGameID' in event && event.abilityGameID) {
    const classConfig = getClassConfig(ctx.sourceActor.class, config)
    const mergedAbilities = {
      ...(config.abilities ?? {}),
      ...(classConfig?.abilities ?? {}),
    }
    
    const abilityFormula = mergedAbilities[event.abilityGameID]
    if (abilityFormula) {
      return abilityFormula(ctx)
    }
  }

  // Fall back to base threat formulas by event type
  switch (event.type) {
    case 'damage':
      return config.baseThreat.damage(ctx)
    case 'heal':
      return config.baseThreat.heal(ctx)
    case 'energize':
      return config.baseThreat.energize(ctx)
    default:
      // Default: no threat
      return {
        formula: '0',
        value: 0,
        splitAmongEnemies: false,
      }
  }
}

/**
 * Get class config for an actor
 */
function getClassConfig(
  wowClass: WowClass | null,
  config: ThreatConfig
): ClassThreatConfig | null {
  if (!wowClass) return null
  return config.classes[wowClass] ?? null
}

/**
 * Get class-specific base threat factor modifier
 */
function getClassModifiers(
  wowClass: WowClass | null,
  config: ThreatConfig
): ThreatModifier[] {
  const classConfig = getClassConfig(wowClass, config)
  if (!classConfig?.baseThreatFactor || classConfig.baseThreatFactor === 1) {
    return []
  }

  const className = wowClass
    ? wowClass.charAt(0).toUpperCase() + wowClass.slice(1)
    : 'Class'

  return [{
    source: 'class',
    name: className,
    value: classConfig.baseThreatFactor,
  }]
}

/**
 * Get all active aura modifiers (global + all classes)
 * This allows cross-class buffs (e.g., Blessing of Salvation) to apply to any actor.
 * The game validates which buffs can be applied, so we merge everything and let
 * the sourceAuras set determine which modifiers actually apply.
 */
function getAuraModifiers(
  ctx: ThreatContext,
  config: ThreatConfig
): ThreatModifier[] {
  // Merge all aura modifiers into a single structure
  const mergedAuraModifiers: Record<number, (ctx: ThreatContext) => ThreatModifier> = {
    ...config.auraModifiers,
  }

  // Add aura modifiers from all class configs
  for (const classConfig of Object.values(config.classes)) {
    if (classConfig?.auraModifiers) {
      Object.assign(mergedAuraModifiers, classConfig.auraModifiers)
    }
  }

  // Apply the merged aura modifiers based on active auras
  return getActiveModifiers(ctx, mergedAuraModifiers)
}


