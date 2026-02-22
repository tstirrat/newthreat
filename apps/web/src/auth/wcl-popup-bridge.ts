/**
 * LocalStorage bridge helpers for popup-based Warcraft Logs OAuth completion.
 */
export const wclAuthPopupResultStorageKey = 'wow-threat.wcl-auth-popup-result'
export const wclAuthPopupResultMessageType = 'wow-threat.wcl-auth-popup-result'

interface WclAuthPopupResultBase {
  createdAtMs: number
}

export interface WclAuthPopupSuccessResult extends WclAuthPopupResultBase {
  bridgeCode: string
  status: 'success'
}

export interface WclAuthPopupErrorResult extends WclAuthPopupResultBase {
  message: string
  status: 'error'
}

export type WclAuthPopupResult =
  | WclAuthPopupSuccessResult
  | WclAuthPopupErrorResult

interface WclAuthPopupResultRawPayload {
  bridgeCode?: unknown
  createdAtMs?: unknown
  message?: unknown
  status?: unknown
}

interface WclAuthPopupResultMessage {
  result?: unknown
  type?: unknown
}

/** Build a success payload from a bridge code. */
export function createWclAuthPopupSuccessResult(
  bridgeCode: string,
): WclAuthPopupSuccessResult {
  return {
    bridgeCode,
    createdAtMs: Date.now(),
    status: 'success',
  }
}

/** Build an error payload from a callback failure message. */
export function createWclAuthPopupErrorResult(
  message: string,
): WclAuthPopupErrorResult {
  return {
    createdAtMs: Date.now(),
    message,
    status: 'error',
  }
}

/** Build a cross-window message payload from a popup result. */
export function createWclAuthPopupResultMessage(result: WclAuthPopupResult): {
  result: WclAuthPopupResult
  type: typeof wclAuthPopupResultMessageType
} {
  return {
    result,
    type: wclAuthPopupResultMessageType,
  }
}

function parseWclAuthPopupResultPayload(
  payload: WclAuthPopupResultRawPayload,
): WclAuthPopupResult | null {
  if (
    payload.status === 'success' &&
    typeof payload.bridgeCode === 'string' &&
    payload.bridgeCode.length > 0 &&
    typeof payload.createdAtMs === 'number'
  ) {
    return {
      bridgeCode: payload.bridgeCode,
      createdAtMs: payload.createdAtMs,
      status: 'success',
    }
  }

  if (
    payload.status === 'error' &&
    typeof payload.message === 'string' &&
    payload.message.length > 0 &&
    typeof payload.createdAtMs === 'number'
  ) {
    return {
      createdAtMs: payload.createdAtMs,
      message: payload.message,
      status: 'error',
    }
  }

  return null
}

/** Parse a raw localStorage value into a typed popup result. */
export function parseWclAuthPopupResult(
  rawValue: string | null,
): WclAuthPopupResult | null {
  if (!rawValue) {
    return null
  }

  try {
    const parsed = JSON.parse(rawValue) as WclAuthPopupResultRawPayload
    return parseWclAuthPopupResultPayload(parsed)
  } catch {
    return null
  }
}

/** Persist a popup result into localStorage for the main window to consume. */
export function publishWclAuthPopupResult(result: WclAuthPopupResult): void {
  window.localStorage.setItem(
    wclAuthPopupResultStorageKey,
    JSON.stringify(result),
  )
}

/** Read and parse the latest popup result from localStorage. */
export function readWclAuthPopupResult(): WclAuthPopupResult | null {
  return parseWclAuthPopupResult(
    window.localStorage.getItem(wclAuthPopupResultStorageKey),
  )
}

/** Clear any stale popup result from localStorage. */
export function clearWclAuthPopupResult(): void {
  window.localStorage.removeItem(wclAuthPopupResultStorageKey)
}

/** Parse a postMessage payload into a typed popup result. */
export function parseWclAuthPopupResultMessage(
  payload: unknown,
): WclAuthPopupResult | null {
  if (!payload || typeof payload !== 'object') {
    return null
  }

  const message = payload as WclAuthPopupResultMessage
  if (
    message.type !== wclAuthPopupResultMessageType ||
    !message.result ||
    typeof message.result !== 'object'
  ) {
    return null
  }

  return parseWclAuthPopupResultPayload(
    message.result as WclAuthPopupResultRawPayload,
  )
}
