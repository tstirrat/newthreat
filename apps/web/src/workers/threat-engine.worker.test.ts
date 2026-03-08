/**
 * Unit tests for threat engine worker message handling by input mode.
 */
import { createDamageEvent } from '@wow-threat/shared'
import type { Report, ReportFight, WCLEvent } from '@wow-threat/wcl-types'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type {
  ThreatEngineWorkerDirectPayload,
  ThreatEngineWorkerIndexedDbPayload,
  ThreatEngineWorkerRequest,
  ThreatEngineWorkerResponse,
} from './threat-engine-worker-types'

const mockFns = vi.hoisted(() => ({
  buildThreatEngineInput: vi.fn(),
  loadThreatWorkerRawEventChunks: vi.fn(),
  processEvents: vi.fn(),
  resolveConfigOrNull: vi.fn(),
  saveThreatWorkerProcessedResult: vi.fn(),
}))

vi.mock('@wow-threat/config', () => ({
  resolveConfigOrNull: mockFns.resolveConfigOrNull,
}))

vi.mock('@wow-threat/engine', () => ({
  ThreatEngine: class {
    processEvents = mockFns.processEvents
  },
  buildThreatEngineInput: mockFns.buildThreatEngineInput,
}))

vi.mock('../lib/threat-engine-worker-cache', () => ({
  loadThreatWorkerRawEventChunks: mockFns.loadThreatWorkerRawEventChunks,
  saveThreatWorkerProcessedResult: mockFns.saveThreatWorkerProcessedResult,
}))

type WorkerContextMock = {
  onmessage: ((message: MessageEvent<ThreatEngineWorkerRequest>) => void) | null
  postMessage: ReturnType<typeof vi.fn>
}

function createTestFight(fightId: number): ReportFight {
  return {
    id: fightId,
    encounterID: 1,
    name: 'Test Fight',
    startTime: 0,
    endTime: 10_000,
    kill: true,
    difficulty: null,
    bossPercentage: null,
    fightPercentage: null,
    enemyNPCs: [],
    enemyPets: [],
    friendlyPlayers: [1],
    friendlyPets: [],
  }
}

function createTestReport(fightId: number): Report {
  return {
    code: 'ABC123xyz',
    title: 'Test Report',
    owner: {
      name: 'Tester',
    },
    visibility: 'public',
    guild: null,
    startTime: 0,
    endTime: 10_000,
    zone: {
      id: 1,
      name: 'Test Zone',
    },
    fights: [createTestFight(fightId)],
    masterData: {
      gameVersion: 2,
      actors: [],
      abilities: [],
    },
    archiveStatus: null,
    rankings: null,
  }
}

function createDirectPayload(
  rawEvents: WCLEvent[],
): ThreatEngineWorkerDirectPayload {
  return {
    inputMode: 'direct',
    fightId: 9,
    inferThreatReduction: false,
    initialAurasByActor: {
      '11': [5, 2, 5],
    },
    rawEvents,
    report: createTestReport(9),
    tankActorIds: [1],
  }
}

function createIndexedDbPayload(): ThreatEngineWorkerIndexedDbPayload {
  return {
    inputMode: 'indexeddb',
    fightId: 9,
    inferThreatReduction: false,
    initialAurasByActor: {
      '11': [5, 2, 5],
    },
    report: createTestReport(9),
    tankActorIds: [1],
    jobKey: 'ABC123xyz:9:req-indexed',
    rawEventChunkCount: 2,
    rawEventCount: 2,
  }
}

function createWorkerContext(): WorkerContextMock {
  return {
    onmessage: null,
    postMessage: vi.fn(),
  }
}

async function registerWorker(workerContext: WorkerContextMock): Promise<void> {
  vi.stubGlobal('self', workerContext)
  await import('./threat-engine.worker')
}

async function dispatchWorkerRequest(
  workerContext: WorkerContextMock,
  request: ThreatEngineWorkerRequest,
): Promise<ThreatEngineWorkerResponse> {
  if (!workerContext.onmessage) {
    throw new Error('worker onmessage handler is not registered')
  }

  workerContext.onmessage(
    new MessageEvent<ThreatEngineWorkerRequest>('message', {
      data: request,
    }),
  )

  await vi.waitFor(() => {
    expect(workerContext.postMessage).toHaveBeenCalledTimes(1)
  })

  const response = workerContext.postMessage.mock.calls[0]?.[0]
  if (!response) {
    throw new Error('worker did not post a response')
  }

  return response as ThreatEngineWorkerResponse
}

describe('threat-engine.worker', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()
    vi.unstubAllGlobals()

    mockFns.resolveConfigOrNull.mockReturnValue({})
    mockFns.buildThreatEngineInput.mockReturnValue({
      actorMap: new Map<number, object>(),
      friendlyActorIds: new Set<number>(),
      enemies: [],
      abilitySchoolMap: new Map<number, number>(),
    })
    mockFns.processEvents.mockReturnValue({
      augmentedEvents: [
        {
          sourceID: 11,
          targetID: 99,
          timestamp: 1000,
          type: 'damage',
        },
      ],
      initialAurasByActor: new Map<number, readonly number[]>([
        [11, [5, 2, 5]],
      ]),
    })
    mockFns.loadThreatWorkerRawEventChunks.mockResolvedValue([])
    mockFns.saveThreatWorkerProcessedResult.mockResolvedValue(true)
  })

  it('handles direct mode requests and returns inline payload data', async () => {
    const workerContext = createWorkerContext()
    await registerWorker(workerContext)

    const rawEvents = [createDamageEvent()]
    const response = await dispatchWorkerRequest(workerContext, {
      requestId: 'req-direct',
      payload: createDirectPayload(rawEvents),
    })

    expect(mockFns.loadThreatWorkerRawEventChunks).not.toHaveBeenCalled()
    expect(mockFns.saveThreatWorkerProcessedResult).not.toHaveBeenCalled()
    expect(mockFns.processEvents).toHaveBeenCalledWith(
      expect.objectContaining({
        rawEvents,
      }),
    )
    expect(response).toEqual(
      expect.objectContaining({
        requestId: 'req-direct',
        status: 'success',
        outputMode: 'inline',
        payload: expect.objectContaining({
          augmentedEvents: expect.any(Array),
          initialAurasByActor: {
            '11': [2, 5],
          },
        }),
      }),
    )
  })

  it('handles indexeddb mode requests and returns completion metadata', async () => {
    const workerContext = createWorkerContext()
    await registerWorker(workerContext)

    const indexedDbRawEvents = [
      createDamageEvent({
        timestamp: 1000,
      }),
      createDamageEvent({
        timestamp: 2000,
      }),
    ]
    mockFns.loadThreatWorkerRawEventChunks.mockResolvedValue(indexedDbRawEvents)

    const payload = createIndexedDbPayload()
    const response = await dispatchWorkerRequest(workerContext, {
      requestId: 'req-indexed',
      payload,
    })

    expect(mockFns.loadThreatWorkerRawEventChunks).toHaveBeenCalledWith({
      jobKey: payload.jobKey,
      rawEventChunkCount: payload.rawEventChunkCount,
    })
    expect(mockFns.saveThreatWorkerProcessedResult).toHaveBeenCalledWith(
      expect.objectContaining({
        jobKey: payload.jobKey,
        payload: expect.objectContaining({
          augmentedEvents: expect.any(Array),
        }),
      }),
    )
    expect(response).toEqual(
      expect.objectContaining({
        requestId: 'req-indexed',
        status: 'success',
        outputMode: 'indexeddb',
        jobKey: payload.jobKey,
        rawEventChunkCount: payload.rawEventChunkCount,
        rawEventCount: indexedDbRawEvents.length,
      }),
    )
    expect(response).not.toHaveProperty('payload')
  })

  it('returns an error response when indexeddb result persistence fails', async () => {
    const workerContext = createWorkerContext()
    await registerWorker(workerContext)

    mockFns.loadThreatWorkerRawEventChunks.mockResolvedValue([
      createDamageEvent(),
    ])
    mockFns.saveThreatWorkerProcessedResult.mockResolvedValue(false)

    const payload = createIndexedDbPayload()
    const response = await dispatchWorkerRequest(workerContext, {
      requestId: 'req-indexed-failure',
      payload,
    })

    expect(mockFns.loadThreatWorkerRawEventChunks).toHaveBeenCalledWith({
      jobKey: payload.jobKey,
      rawEventChunkCount: payload.rawEventChunkCount,
    })
    expect(response).toEqual(
      expect.objectContaining({
        requestId: 'req-indexed-failure',
        status: 'error',
        error: expect.stringContaining(
          'unable to persist indexeddb worker output',
        ),
      }),
    )
  })
})
