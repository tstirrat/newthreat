/**
 * Allowed origin parsing utilities.
 */

/** Parse a comma-delimited allowlist into normalized origins. */
export function parseAllowedOrigins(rawOrigins: string | undefined): string[] {
  if (!rawOrigins) {
    return []
  }

  return rawOrigins
    .split(',')
    .map((value) => value.trim())
    .filter((value) => value.length > 0)
}

interface ParsedOriginPattern {
  protocol: string
  hostPattern: string
  port: string
}

const originPatternRegex = /^(https?):\/\/([^/:]+)(?::(\d+))?$/

function parseOriginPattern(pattern: string): ParsedOriginPattern | null {
  const matches = pattern.match(originPatternRegex)
  if (!matches) {
    return null
  }

  const protocol = matches[1]
  const hostPattern = matches[2]
  const port = matches[3] ?? ''

  if (!protocol || !hostPattern) {
    return null
  }

  return {
    hostPattern: hostPattern.toLowerCase(),
    port,
    protocol,
  }
}

function escapeRegex(value: string): string {
  return value.replace(/[|\\{}()[\]^$+?.]/g, '\\$&')
}

function createWildcardHostRegex(hostPattern: string): RegExp {
  const regexPattern = hostPattern
    .split('*')
    .map((segment) => escapeRegex(segment))
    .join('[^.]+')

  return new RegExp(`^${regexPattern}$`, 'i')
}

function isWildcardOriginMatch(
  originUrl: URL,
  allowedOriginPattern: string,
): boolean {
  const parsedPattern = parseOriginPattern(allowedOriginPattern)
  if (!parsedPattern || !parsedPattern.hostPattern.includes('*')) {
    return false
  }

  if (originUrl.protocol !== `${parsedPattern.protocol}:`) {
    return false
  }

  if (originUrl.port !== parsedPattern.port) {
    return false
  }

  const hostRegex = createWildcardHostRegex(parsedPattern.hostPattern)
  return hostRegex.test(originUrl.hostname.toLowerCase())
}

/** Check whether an origin is explicitly allowed. */
export function isOriginAllowed(
  origin: string,
  allowedOrigins: string[],
): boolean {
  if (allowedOrigins.includes(origin)) {
    return true
  }

  let originUrl: URL
  try {
    originUrl = new URL(origin)
  } catch {
    return false
  }

  return allowedOrigins.some((allowedOriginPattern) =>
    isWildcardOriginMatch(originUrl, allowedOriginPattern),
  )
}
