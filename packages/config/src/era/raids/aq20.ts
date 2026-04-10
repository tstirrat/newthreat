/**
 * Ruins of Ahn'Qiraj Raid Config
 *
 * Raid-specific spell sets and encounter rules for AQ20.
 */
import type { SpellId } from '@wow-threat/shared'

export const Spells = {
  EnvelopingWinds: 25189, // https://www.wowhead.com/classic/spell=25189/
}

/**
 * Aggro-loss buffs from Ruins of Ahn'Qiraj bosses.
 */
export const aq20AggroLossBuffs: ReadonlySet<SpellId> = new Set([
  Spells.EnvelopingWinds, // Ossirian: Enveloping Winds
])
