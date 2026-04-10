/**
 * Tests for Anniversary (TBC) deltas over Era defaults.
 */
import { describe, expect, it } from 'vitest'

import { druidConfig as eraDruidConfig } from '../era/classes/druid'
import { paladinConfig as eraPaladinConfig } from '../era/classes/paladin'
import { priestConfig as eraPriestConfig } from '../era/classes/priest'
import { rogueConfig as eraRogueConfig } from '../era/classes/rogue'
import { shamanConfig as eraShamanConfig } from '../era/classes/shaman'
import { warlockConfig as eraWarlockConfig } from '../era/classes/warlock'
import { warriorConfig as eraWarriorConfig } from '../era/classes/warrior'
import { baseThreat as eraBaseThreat } from '../era/general'
import { aq20AggroLossBuffs } from '../era/raids/aq20'
import { aq40AggroLossBuffs, aq40AuraModifiers } from '../era/raids/aq40'
import { bwlAbilities as eraBwlAbilities } from '../era/raids/bwl'
import { mcAggroLossBuffs } from '../era/raids/mc'
import { naxxAbilities as eraNaxxAbilities } from '../era/raids/naxx'
import { onyxiaAbilities as eraOnyxiaAbilities } from '../era/raids/ony'
import { druidConfig as anniversaryDruidConfig } from './classes/druid'
import { hunterConfig as anniversaryHunterConfig } from './classes/hunter'
import { mageConfig as anniversaryMageConfig } from './classes/mage'
import { paladinConfig as anniversaryPaladinConfig } from './classes/paladin'
import { priestConfig as anniversaryPriestConfig } from './classes/priest'
import { rogueConfig as anniversaryRogueConfig } from './classes/rogue'
import { shamanConfig as anniversaryShamanConfig } from './classes/shaman'
import { warlockConfig as anniversaryWarlockConfig } from './classes/warlock'
import { warriorConfig as anniversaryWarriorConfig } from './classes/warrior'
import { anniversaryConfig } from './index'
import { naxxAbilities as anniversaryNaxxAbilities } from './raids/naxx'

describe('anniversary deltas', () => {
  it('shares base threat rules with era', () => {
    expect(anniversaryConfig.baseThreat).toBe(eraBaseThreat)
  })

  it('keeps unchanged vanilla raid abilities shared by reference', () => {
    expect(anniversaryConfig.abilities?.[18670]).toBe(eraBwlAbilities[18670])
    expect(anniversaryConfig.abilities?.[18392]).toBe(eraOnyxiaAbilities[18392])
  })

  it('overrides naxx hateful strike with tbc behavior', () => {
    expect(anniversaryNaxxAbilities).not.toBe(eraNaxxAbilities)
    expect(anniversaryNaxxAbilities[28308]).not.toBe(eraNaxxAbilities[28308])
  })

  it('keeps unchanged tbc classes shared by reference and overrides others', () => {
    expect(anniversaryDruidConfig).not.toBe(eraDruidConfig)
    expect(anniversaryWarriorConfig).not.toBe(eraWarriorConfig)
    expect(anniversaryPaladinConfig).not.toBe(eraPaladinConfig)
    expect(anniversaryPriestConfig).not.toBe(eraPriestConfig)
    expect(anniversaryRogueConfig).not.toBe(eraRogueConfig)
    expect(anniversaryShamanConfig).not.toBe(eraShamanConfig)
    expect(anniversaryWarlockConfig).not.toBe(eraWarlockConfig)
    expect(anniversaryMageConfig).not.toBeUndefined()
  })

  it('registers tbc class-specific ability overrides', () => {
    expect(anniversaryWarriorConfig.abilities[25225]).toBeDefined()
    expect(anniversaryDruidConfig.abilities[33745]).toBeDefined()
    expect(anniversaryPaladinConfig.abilities[31789]).toBeDefined()
    expect(anniversaryPriestConfig.abilities[25375]).toBeDefined()
    expect(anniversaryRogueConfig.abilities[26889]).toBeDefined()
    expect(anniversaryShamanConfig.abilities[25464]).toBeDefined()
    expect(anniversaryWarlockConfig.abilities[29858]).toBeDefined()
    expect(anniversaryMageConfig.abilities[66]).toBeDefined()
    expect(anniversaryHunterConfig.abilities[27020]).toBeDefined()
  })

  it('registers tbc raid abilities from karazhan/ssc/tk/gruul/bt', () => {
    expect(anniversaryConfig.abilities?.[37098]).toBeDefined() // Nightbane
    expect(anniversaryConfig.abilities?.[38112]).toBeDefined() // Vashj
    expect(anniversaryConfig.abilities?.[33237]).toBeDefined() // HKM
    expect(anniversaryConfig.abilities?.[33813]).toBeDefined() // Gruul
    expect(anniversaryConfig.abilities?.[40647]).toBeDefined() // Illidan
  })

  it('adds tbc global enchant aura modifiers and gear implications', () => {
    expect(anniversaryConfig.auraModifiers[2613]).toBeDefined()
    expect(anniversaryConfig.auraModifiers[2621]).toBeDefined()
    expect(anniversaryConfig.auraModifiers[40618]).toBeDefined()

    const inferred = anniversaryConfig.gearImplications?.([
      { id: 1, permanentEnchant: 2613 },
      { id: 2, permanentEnchant: 2621 },
    ])
    expect(inferred).toEqual([2613, 2621])
  })

  it('extends fixate buffs with black temple fel rage', () => {
    expect(anniversaryConfig.fixateBuffs?.has(40604)).toBe(true)
  })

  it('inherits era vanilla raid abilities via extendConfig', () => {
    // BWL — Broodlord Knock Away
    expect(anniversaryConfig.abilities?.[18670]).toBe(eraBwlAbilities[18670])
    // Onyxia — Fireball
    expect(anniversaryConfig.abilities?.[18392]).toBe(eraOnyxiaAbilities[18392])
  })

  it('inherits era aq40 aura modifiers via extendConfig', () => {
    // Fetish of the Sand Reaver
    const fetish = 26400
    expect(anniversaryConfig.auraModifiers[fetish]).toBe(
      aq40AuraModifiers[fetish],
    )
  })

  it('inherits era aggro-loss buffs via extendConfig', () => {
    // MC: Lucifron Dominate Mind
    for (const spellId of mcAggroLossBuffs) {
      expect(anniversaryConfig.aggroLossBuffs?.has(spellId)).toBe(true)
    }
    // AQ40: Princess Yauj Fear
    for (const spellId of aq40AggroLossBuffs) {
      expect(anniversaryConfig.aggroLossBuffs?.has(spellId)).toBe(true)
    }
    // AQ20: Ossirian Enveloping Winds
    for (const spellId of aq20AggroLossBuffs) {
      expect(anniversaryConfig.aggroLossBuffs?.has(spellId)).toBe(true)
    }
  })
})
