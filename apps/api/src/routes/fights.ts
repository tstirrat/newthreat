/**
 * Fights Routes
 *
 * GET /reports/:code/fights/:id - Get fight details
 */

import { Hono } from 'hono'
import type { Bindings, Variables } from '../types/bindings'
import { WCLClient } from '../services/wcl'
import { invalidFightId, fightNotFound, reportNotFound } from '../middleware/error'
import { eventsRoutes } from './events'

export const fightsRoutes = new Hono<{ Bindings: Bindings; Variables: Variables }>()

/**
 * GET /reports/:code/fights/:id
 * Returns detailed fight information
 */
fightsRoutes.get('/:id', async (c) => {
  const code = c.req.param('code')!
  const idParam = c.req.param('id')!

  // Validate fight ID
  const fightId = parseInt(idParam, 10)
  if (Number.isNaN(fightId)) {
    throw invalidFightId(idParam)
  }

  const wcl = new WCLClient(c.env)
  const data = await wcl.getReport(code)

  if (!data?.reportData?.report) {
    throw reportNotFound(code)
  }

  const report = data.reportData.report

  // Find the specific fight
  const fight = report.fights.find((f) => f.id === fightId)
  if (!fight) {
    throw fightNotFound(code, fightId)
  }

  // Get actors relevant to this fight
  const masterData = report.masterData
  
  // Build a lookup map for faster actor resolution
  const actorLookup = new Map(masterData.actors.map((a) => [a.id, a]))
  
  // Build actors from fight participants
  const actors = (fight.friendlyPlayers ?? [])
    .map((playerId) => ({ id: playerId, actor: actorLookup.get(playerId) }))
    .map(({ id, actor }) => ({
      id,
      name: actor?.name ?? 'Unknown',
      type: (actor?.type ?? 'Player') as 'Player' | 'Pet' | 'Guardian' | 'Companion',
      class: actor?.type === 'Player' ? actor.subType : null,
      spec: null, // Would need combatantinfo events
      role: null, // Would need combatantinfo events
      petOwner: actor?.petOwner ?? null,
    }))

  // Build enemies from fight-level enemyNPCs + enemyPets
  const enemies = [...(fight.enemyNPCs ?? []), ...(fight.enemyPets ?? [])]
    .map((npc) => ({ npc, actor: actorLookup.get(npc.id) }))
    .map(({ npc, actor }) => ({
      id: npc.id,
      guid: npc.gameID,
      name: actor?.name ?? 'Unknown',
      instanceCount: npc.instanceCount,
      type: (actor?.type === 'Boss' ? 'Boss' : 'Add') as 'Boss' | 'Add' | 'Trash',
    }))

  const cacheControl =
    c.env.ENVIRONMENT === 'development'
      ? 'no-store, no-cache, must-revalidate'
      : 'public, max-age=31536000, immutable'

  return c.json(
    {
      id: fight.id,
      reportCode: code,
      name: fight.name,
      startTime: fight.startTime,
      endTime: fight.endTime,
      kill: fight.kill,
      difficulty: fight.difficulty,
      enemies,
      actors,
      phases: [], // Would need phase data from WCL
    },
    200,
    {
      'Cache-Control': cacheControl,
    }
  )
})

// Mount events routes under /reports/:code/fights/:id/events
fightsRoutes.route('/:id/events', eventsRoutes)
