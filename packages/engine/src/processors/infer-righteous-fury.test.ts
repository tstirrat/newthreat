/**
 * Tests for infer-righteous-fury processor.
 */
import { SpellSchool } from '@wow-threat/shared'
import type {
  PlayerClass,
  Report,
  ReportActor,
  ReportFight,
} from '@wow-threat/wcl-types'
import { describe, expect, it } from 'vitest'

import {
  type ProcessorBaseContext,
  createProcessorNamespace,
  initialAuraAdditionsKey,
  mergeInitialAurasWithAdditions,
  runFightPrepass,
} from '../event-processors'
import { createMockThreatConfig } from '../test/helpers/config'
import { createInferRighteousFuryProcessor } from './infer-righteous-fury'

const ERA_TBC_RF_SPELL_ID = 25780
const SOD_RF_SPELL_ID = 407627

function createPlayerActor(
  id: number,
  name: string,
  subType: PlayerClass,
): ReportActor {
  return {
    id,
    name,
    type: 'Player',
    subType,
  }
}

function createFight(
  id: number,
  encounterID: number,
  friendlyPlayers: number[],
): ReportFight {
  return {
    id,
    encounterID,
    name: 'Processor Test Fight',
    startTime: 1000,
    endTime: 10_000,
    kill: true,
    difficulty: null,
    bossPercentage: null,
    fightPercentage: null,
    enemyNPCs: [],
    enemyPets: [],
    friendlyPlayers,
    friendlyPets: [],
  }
}

function createReport({
  actors,
  fight,
}: {
  actors: ReportActor[]
  fight: ReportFight
}): Report {
  return {
    code: 'PROCESSORTEST',
    title: 'Processor Test',
    owner: { name: 'Owner' },
    guild: null,
    startTime: fight.startTime,
    endTime: fight.endTime,
    zone: { id: 1, name: 'Test Zone' },
    fights: [fight],
    masterData: {
      gameVersion: 2,
      actors,
      abilities: [],
    },
    rankings: null,
  }
}

function createPrepassContext({
  report,
  fight,
  inferThreatReduction,
  tankActorIds = new Set<number>(),
  initialAurasByActor = new Map<number, readonly number[]>(),
  rfSpellId = ERA_TBC_RF_SPELL_ID,
}: {
  report: Report
  fight: ReportFight
  inferThreatReduction: boolean
  tankActorIds?: Set<number>
  initialAurasByActor?: Map<number, readonly number[]>
  rfSpellId?: number
}): ProcessorBaseContext {
  return {
    namespace: createProcessorNamespace(),
    actorMap: new Map(),
    friendlyActorIds: new Set(fight.friendlyPlayers),
    enemies: [],
    encounterId: fight.encounterID ?? null,
    config: createMockThreatConfig({
      classes: {
        paladin: {
          auraModifiers: {
            [rfSpellId]: () => ({
              source: 'buff',
              name: 'Righteous Fury',
              value: 1.6,
              schoolMask: SpellSchool.Holy,
            }),
          },
          abilities: {},
        },
      },
    }),
    report,
    fight,
    inferThreatReduction,
    tankActorIds,
    initialAurasByActor,
  }
}

describe('createInferRighteousFuryProcessor', () => {
  it('returns null when inferThreatReduction is disabled', () => {
    const fight = createFight(1, 1602, [1])
    const report = createReport({
      actors: [createPlayerActor(1, 'Palatank', 'Paladin')],
      fight,
    })

    const processor = createInferRighteousFuryProcessor({
      report,
      fight,
      inferThreatReduction: false,
      tankActorIds: new Set([1]),
    })

    expect(processor).toBeNull()
  })

  it('returns null when there are no paladin tanks in the fight', () => {
    const fight = createFight(2, 1602, [1, 2])
    const report = createReport({
      actors: [
        createPlayerActor(1, 'Tanky', 'Warrior'),
        createPlayerActor(2, 'Priesty', 'Priest'),
      ],
      fight,
    })

    const processor = createInferRighteousFuryProcessor({
      report,
      fight,
      inferThreatReduction: true,
      tankActorIds: new Set([1]),
    })

    expect(processor).toBeNull()
  })

  it('returns null when a paladin is in the fight but is not a tank', () => {
    const fight = createFight(3, 1602, [1, 2])
    const report = createReport({
      actors: [
        createPlayerActor(1, 'Tanky', 'Warrior'),
        createPlayerActor(2, 'Paladps', 'Paladin'),
      ],
      fight,
    })

    const processor = createInferRighteousFuryProcessor({
      report,
      fight,
      inferThreatReduction: true,
      tankActorIds: new Set([1]),
    })

    expect(processor).toBeNull()
  })

  it('returns null when tankActorIds is undefined', () => {
    const fight = createFight(4, 1602, [1])
    const report = createReport({
      actors: [createPlayerActor(1, 'Palatank', 'Paladin')],
      fight,
    })

    const processor = createInferRighteousFuryProcessor({
      report,
      fight,
      inferThreatReduction: true,
      tankActorIds: undefined,
    })

    expect(processor).toBeNull()
  })

  it('infers Era RF aura (25780) on a paladin tank missing RF', () => {
    const fight = createFight(5, 1602, [1, 2])
    const report = createReport({
      actors: [
        createPlayerActor(1, 'Palatank', 'Paladin'),
        createPlayerActor(2, 'Tanky', 'Warrior'),
      ],
      fight,
    })
    const processor = createInferRighteousFuryProcessor({
      report,
      fight,
      inferThreatReduction: true,
      tankActorIds: new Set([1, 2]),
    })

    expect(processor).not.toBeNull()
    if (!processor) {
      return
    }

    const context = createPrepassContext({
      report,
      fight,
      inferThreatReduction: true,
      tankActorIds: new Set([1, 2]),
      rfSpellId: ERA_TBC_RF_SPELL_ID,
    })

    runFightPrepass({
      rawEvents: [],
      processors: [processor],
      baseContext: context,
    })

    const mergedInitialAurasByActor = mergeInitialAurasWithAdditions(
      context.initialAurasByActor,
      context.namespace.get(initialAuraAdditionsKey),
    )

    expect(mergedInitialAurasByActor.get(1)).toEqual([ERA_TBC_RF_SPELL_ID])
    expect(mergedInitialAurasByActor.get(2)).toBeUndefined()
  })

  it('infers SoD RF aura (407627) on a paladin tank missing RF when SoD config is active', () => {
    const fight = createFight(6, 1602, [1])
    const report = createReport({
      actors: [createPlayerActor(1, 'Palatank', 'Paladin')],
      fight,
    })
    const processor = createInferRighteousFuryProcessor({
      report,
      fight,
      inferThreatReduction: true,
      tankActorIds: new Set([1]),
    })

    expect(processor).not.toBeNull()
    if (!processor) {
      return
    }

    const context = createPrepassContext({
      report,
      fight,
      inferThreatReduction: true,
      tankActorIds: new Set([1]),
      rfSpellId: SOD_RF_SPELL_ID,
    })

    runFightPrepass({
      rawEvents: [],
      processors: [processor],
      baseContext: context,
    })

    const mergedInitialAurasByActor = mergeInitialAurasWithAdditions(
      context.initialAurasByActor,
      context.namespace.get(initialAuraAdditionsKey),
    )

    expect(mergedInitialAurasByActor.get(1)).toEqual([SOD_RF_SPELL_ID])
  })

  it('does not infer RF when paladin tank already has Era RF aura', () => {
    const fight = createFight(7, 1602, [1])
    const report = createReport({
      actors: [createPlayerActor(1, 'Palatank', 'Paladin')],
      fight,
    })
    const processor = createInferRighteousFuryProcessor({
      report,
      fight,
      inferThreatReduction: true,
      tankActorIds: new Set([1]),
    })

    expect(processor).not.toBeNull()
    if (!processor) {
      return
    }

    const context = createPrepassContext({
      report,
      fight,
      inferThreatReduction: true,
      tankActorIds: new Set([1]),
      initialAurasByActor: new Map([[1, [ERA_TBC_RF_SPELL_ID]]]),
    })

    runFightPrepass({
      rawEvents: [],
      processors: [processor],
      baseContext: context,
    })

    const mergedInitialAurasByActor = mergeInitialAurasWithAdditions(
      context.initialAurasByActor,
      context.namespace.get(initialAuraAdditionsKey),
    )

    expect(mergedInitialAurasByActor.get(1)).toEqual([ERA_TBC_RF_SPELL_ID])
  })

  it('does not infer RF when paladin tank already has SoD RF aura', () => {
    const fight = createFight(8, 1602, [1])
    const report = createReport({
      actors: [createPlayerActor(1, 'Palatank', 'Paladin')],
      fight,
    })
    const processor = createInferRighteousFuryProcessor({
      report,
      fight,
      inferThreatReduction: true,
      tankActorIds: new Set([1]),
    })

    expect(processor).not.toBeNull()
    if (!processor) {
      return
    }

    const context = createPrepassContext({
      report,
      fight,
      inferThreatReduction: true,
      tankActorIds: new Set([1]),
      initialAurasByActor: new Map([[1, [SOD_RF_SPELL_ID]]]),
      rfSpellId: ERA_TBC_RF_SPELL_ID,
    })

    runFightPrepass({
      rawEvents: [],
      processors: [processor],
      baseContext: context,
    })

    const mergedInitialAurasByActor = mergeInitialAurasWithAdditions(
      context.initialAurasByActor,
      context.namespace.get(initialAuraAdditionsKey),
    )

    expect(mergedInitialAurasByActor.get(1)).toEqual([SOD_RF_SPELL_ID])
  })

  it('does not infer RF when config has no paladin aura modifiers', () => {
    const fight = createFight(9, 1602, [1])
    const report = createReport({
      actors: [createPlayerActor(1, 'Palatank', 'Paladin')],
      fight,
    })
    const processor = createInferRighteousFuryProcessor({
      report,
      fight,
      inferThreatReduction: true,
      tankActorIds: new Set([1]),
    })

    expect(processor).not.toBeNull()
    if (!processor) {
      return
    }

    // Default mock config has no paladin class entry
    const context: ProcessorBaseContext = {
      namespace: createProcessorNamespace(),
      actorMap: new Map(),
      friendlyActorIds: new Set(fight.friendlyPlayers),
      enemies: [],
      encounterId: fight.encounterID ?? null,
      config: createMockThreatConfig(),
      report,
      fight,
      inferThreatReduction: true,
      tankActorIds: new Set([1]),
      initialAurasByActor: new Map(),
    }

    runFightPrepass({
      rawEvents: [],
      processors: [processor],
      baseContext: context,
    })

    const mergedInitialAurasByActor = mergeInitialAurasWithAdditions(
      context.initialAurasByActor,
      context.namespace.get(initialAuraAdditionsKey),
    )

    expect(mergedInitialAurasByActor.get(1)).toBeUndefined()
  })

  it('applies RF only to paladin tanks, not to warrior tanks', () => {
    const fight = createFight(10, 1602, [1, 2, 3])
    const report = createReport({
      actors: [
        createPlayerActor(1, 'Palatank', 'Paladin'),
        createPlayerActor(2, 'Warriortank', 'Warrior'),
        createPlayerActor(3, 'Roguey', 'Rogue'),
      ],
      fight,
    })
    const processor = createInferRighteousFuryProcessor({
      report,
      fight,
      inferThreatReduction: true,
      tankActorIds: new Set([1, 2]),
    })

    expect(processor).not.toBeNull()
    if (!processor) {
      return
    }

    const context = createPrepassContext({
      report,
      fight,
      inferThreatReduction: true,
      tankActorIds: new Set([1, 2]),
    })

    runFightPrepass({
      rawEvents: [],
      processors: [processor],
      baseContext: context,
    })

    const mergedInitialAurasByActor = mergeInitialAurasWithAdditions(
      context.initialAurasByActor,
      context.namespace.get(initialAuraAdditionsKey),
    )

    expect(mergedInitialAurasByActor.get(1)).toEqual([ERA_TBC_RF_SPELL_ID])
    expect(mergedInitialAurasByActor.get(2)).toBeUndefined()
    expect(mergedInitialAurasByActor.get(3)).toBeUndefined()
  })
})
