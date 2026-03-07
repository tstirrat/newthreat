/**
 * Tests for origin allowlist parsing and matching.
 */
import { describe, expect, it } from 'vitest'

import { isOriginAllowed, parseAllowedOrigins } from './origins'

describe('parseAllowedOrigins', () => {
  it('returns an empty array when config is undefined', () => {
    expect(parseAllowedOrigins(undefined)).toEqual([])
  })

  it('trims and filters comma-delimited origins', () => {
    expect(
      parseAllowedOrigins(
        ' https://wow-threat.web.app, ,http://localhost:5173 ',
      ),
    ).toEqual(['https://wow-threat.web.app', 'http://localhost:5173'])
  })
})

describe('isOriginAllowed', () => {
  it('allows exact origin matches', () => {
    expect(
      isOriginAllowed('https://wow-threat.web.app', [
        'https://wow-threat.web.app',
      ]),
    ).toBe(true)
  })

  it('allows wildcard subdomain matches', () => {
    expect(
      isOriginAllowed('https://wow-threat--pr-101-abcd.web.app', [
        'https://wow-threat--*.web.app',
      ]),
    ).toBe(true)
  })

  it('allows wildcard prefix matches', () => {
    expect(
      isOriginAllowed('https://preview123.firebaseapp.com', [
        'https://*.firebaseapp.com',
      ]),
    ).toBe(true)
  })

  it('rejects base domain for wildcard entries', () => {
    expect(
      isOriginAllowed('https://firebaseapp.com', ['https://*.firebaseapp.com']),
    ).toBe(false)
  })

  it('rejects protocol mismatches', () => {
    expect(
      isOriginAllowed('http://wow-threat--pr-101-abcd.web.app', [
        'https://wow-threat--*.web.app',
      ]),
    ).toBe(false)
  })

  it('rejects origins with mismatched ports', () => {
    expect(
      isOriginAllowed('https://preview.web.app:8443', ['https://*.web.app']),
    ).toBe(false)
  })

  it('rejects invalid origin values', () => {
    expect(
      isOriginAllowed('not-an-origin', ['https://wow-threat.web.app']),
    ).toBe(false)
  })
})
