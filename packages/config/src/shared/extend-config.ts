/**
 * Config extension utility for derived ThreatConfig objects.
 */
import type { SpellId, ThreatConfig } from '@wow-threat/shared'

/**
 * Patch object for {@link extendConfig}.
 *
 * - Scalar / function fields replace the base value when provided; omitted
 *   fields fall back to the base.
 * - Record fields (`abilities`, `auraModifiers`, `encounters`) merge with the
 *   base — extension entries win on conflict, base entries not mentioned are
 *   inherited automatically.
 * - Set fields (`aggroLossBuffs`, `fixateBuffs`, `invulnerabilityBuffs`) are
 *   additions — the base set is always unioned in automatically.
 */
export type ThreatConfigExtension = {
  /** Required — bump on every effective change. */
  version: number
  displayName?: string
  wowhead?: ThreatConfig['wowhead']
  resolve?: ThreatConfig['resolve']
  baseThreat?: ThreatConfig['baseThreat']
  classes?: ThreatConfig['classes']
  /** Merged with base — extension entries override base entries for the same key. */
  abilities?: ThreatConfig['abilities']
  /** Merged with base — extension entries override base entries for the same key. */
  auraModifiers?: ThreatConfig['auraModifiers']
  gearImplications?: ThreatConfig['gearImplications']
  /** Merged with base — extension entries override base entries for the same key. */
  encounters?: ThreatConfig['encounters']
  /** Additions only — the base set is always included. */
  aggroLossBuffs?: Iterable<SpellId>
  /** Additions only — the base set is always included. */
  fixateBuffs?: Iterable<SpellId>
  /** Additions only — the base set is always included. */
  invulnerabilityBuffs?: Iterable<SpellId>
}

/**
 * Derive a new ThreatConfig from a base config.
 *
 * - Scalar / function fields in `ext` replace the base; omitted fields fall back.
 * - Record fields (`abilities`, `auraModifiers`, `encounters`) merge with the
 *   base so any addition to a base record propagates to all derived configs.
 * - Set fields (`aggroLossBuffs`, `fixateBuffs`, `invulnerabilityBuffs`) union
 *   with the base so any addition to a base set propagates automatically.
 */
export function extendConfig(
  base: ThreatConfig,
  ext: ThreatConfigExtension,
): ThreatConfig {
  return {
    version: ext.version,
    displayName: ext.displayName ?? base.displayName,
    wowhead: ext.wowhead ?? base.wowhead,
    resolve: ext.resolve ?? base.resolve,
    baseThreat: ext.baseThreat ?? base.baseThreat,
    classes: ext.classes ?? base.classes,
    abilities:
      base.abilities !== undefined || ext.abilities !== undefined
        ? { ...base.abilities, ...ext.abilities }
        : undefined,
    auraModifiers: { ...base.auraModifiers, ...ext.auraModifiers },
    gearImplications: ext.gearImplications ?? base.gearImplications,
    encounters:
      base.encounters !== undefined || ext.encounters !== undefined
        ? { ...base.encounters, ...ext.encounters }
        : undefined,
    aggroLossBuffs: new Set<SpellId>([
      ...(base.aggroLossBuffs ?? []),
      ...(ext.aggroLossBuffs ?? []),
    ]),
    fixateBuffs: new Set<SpellId>([
      ...(base.fixateBuffs ?? []),
      ...(ext.fixateBuffs ?? []),
    ]),
    invulnerabilityBuffs: new Set<SpellId>([
      ...(base.invulnerabilityBuffs ?? []),
      ...(ext.invulnerabilityBuffs ?? []),
    ]),
  }
}
