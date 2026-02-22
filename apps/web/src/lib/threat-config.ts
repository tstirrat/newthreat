/**
 * Threat config resolution helpers for report metadata.
 */
import { resolveConfigOrNull } from '@wow-threat/config'
import type { ThreatConfig } from '@wow-threat/shared'

import type { ReportResponse } from '../types/api'

/** Resolve the active threat config from report metadata using current app config code. */
export function resolveCurrentThreatConfig(
  report: ReportResponse,
): ThreatConfig | null {
  return resolveConfigOrNull({
    report: {
      startTime: report.startTime,
      masterData: {
        gameVersion: report.gameVersion,
      },
      zone: report.zone ?? {},
      fights: report.fights.map((fight) => ({
        classicSeasonID: fight.classicSeasonID ?? null,
      })),
    },
  })
}
