/**
 * Tests for WCL OAuth helpers.
 */
import { afterEach, describe, expect, it, vi } from 'vitest'

import { createMockBindings } from '../../test/setup'
import { type AppError, ErrorCodes } from '../middleware/error'
import {
  buildWclLoginUrl,
  exchangeWclAuthorizationCode,
  fetchCurrentWclUser,
  refreshWclAccessToken,
} from './wcl-oauth'

describe('buildWclLoginUrl', () => {
  it('includes required OAuth query parameters', () => {
    const env = createMockBindings()
    const url = new URL(buildWclLoginUrl(env, 'test-state'))

    expect(url.origin).toBe('https://www.warcraftlogs.com')
    expect(url.pathname).toBe('/oauth/authorize')
    expect(url.searchParams.get('client_id')).toBe(env.WCL_CLIENT_ID)
    expect(url.searchParams.get('redirect_uri')).toBe(
      env.WCL_OAUTH_REDIRECT_URI,
    )
    expect(url.searchParams.get('response_type')).toBe('code')
    expect(url.searchParams.get('state')).toBe('test-state')
  })
})

function mockTokenResponse(overrides: Record<string, unknown> = {}) {
  return new Response(
    JSON.stringify({
      access_token: 'wcl-access-token',
      expires_in: 3600,
      refresh_token: 'wcl-refresh-token',
      token_type: 'Bearer',
      ...overrides,
    }),
    {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    },
  )
}

describe('exchangeWclAuthorizationCode', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('sends correct POST body and returns parsed tokens', async () => {
    const env = createMockBindings()
    const mockFetch = vi.fn().mockResolvedValue(mockTokenResponse())
    vi.stubGlobal('fetch', mockFetch)

    const result = await exchangeWclAuthorizationCode(env, 'auth-code-123')

    expect(result.access_token).toBe('wcl-access-token')
    expect(result.refresh_token).toBe('wcl-refresh-token')
    expect(result.expires_in).toBe(3600)

    const [, init] = mockFetch.mock.calls[0] as [string, RequestInit]
    const body = new URLSearchParams(init.body as string)
    expect(body.get('grant_type')).toBe('authorization_code')
    expect(body.get('code')).toBe('auth-code-123')
    expect(body.get('redirect_uri')).toBe(env.WCL_OAUTH_REDIRECT_URI)
  })

  it('throws on non-ok response', async () => {
    const env = createMockBindings()
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response('error', { status: 400 })),
    )

    await expect(exchangeWclAuthorizationCode(env, 'bad-code')).rejects.toThrow(
      /WCL token endpoint failed/,
    )
  })
})

describe('refreshWclAccessToken', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('sends refresh_token grant type', async () => {
    const env = createMockBindings()
    const mockFetch = vi.fn().mockResolvedValue(mockTokenResponse())
    vi.stubGlobal('fetch', mockFetch)

    const result = await refreshWclAccessToken(env, 'my-refresh-token')

    expect(result.access_token).toBe('wcl-access-token')

    const [, init] = mockFetch.mock.calls[0] as [string, RequestInit]
    const body = new URLSearchParams(init.body as string)
    expect(body.get('grant_type')).toBe('refresh_token')
    expect(body.get('refresh_token')).toBe('my-refresh-token')
  })
})

describe('fetchCurrentWclUser', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('extracts id and name from graphql response', async () => {
    const mockFetch = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          data: {
            userData: {
              currentUser: {
                id: 42,
                name: 'Thrall',
              },
            },
          },
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        },
      ),
    )
    vi.stubGlobal('fetch', mockFetch)

    const user = await fetchCurrentWclUser('token')
    expect(user.id).toBe('42')
    expect(user.name).toBe('Thrall')

    const [, init] = mockFetch.mock.calls[0] as [string, RequestInit]
    expect(init.method).toBe('POST')
    expect(init.headers).toMatchObject({
      Authorization: 'Bearer token',
      'Content-Type': 'application/json',
    })
    const body = JSON.parse(String(init.body)) as { query: string }
    expect(body.query).toContain('currentUser')
  })

  it('falls back to generated name when name is missing', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            data: {
              userData: {
                currentUser: {
                  id: 99,
                  name: null,
                },
              },
            },
          }),
          {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          },
        ),
      ),
    )

    const user = await fetchCurrentWclUser('token')
    expect(user.id).toBe('99')
    expect(user.name).toBe('wcl:99')
  })

  it('throws when user id is missing', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            data: {
              userData: {
                currentUser: null,
              },
            },
          }),
          {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          },
        ),
      ),
    )

    await expect(fetchCurrentWclUser('token')).rejects.toThrow(/user id/i)
  })

  it('throws when graphql returns errors', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            errors: [{ message: 'Forbidden field' }],
          }),
          {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          },
        ),
      ),
    )

    await expect(fetchCurrentWclUser('token')).rejects.toThrow(
      /Forbidden field/,
    )
  })

  it('throws on non-ok response', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response('forbidden', { status: 403 })),
    )

    await expect(fetchCurrentWclUser('token')).rejects.toThrow(
      /Failed to fetch WCL user profile/,
    )
  })

  it('throws rate-limited error with retry-after details from WCL', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response('rate limited', {
          status: 429,
          headers: {
            'Retry-After': '12',
          },
        }),
      ),
    )

    await expect(fetchCurrentWclUser('token')).rejects.toMatchObject({
      code: ErrorCodes.WCL_RATE_LIMITED,
      details: {
        context: 'wcl-user-profile',
        retryAfter: '12',
        retryAfterSeconds: 12,
      },
      statusCode: 429,
    } satisfies Partial<AppError>)
  })

  it('throws rate-limited error without retry-after details when absent', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response('rate limited', {
          status: 429,
        }),
      ),
    )

    await expect(fetchCurrentWclUser('token')).rejects.toMatchObject({
      code: ErrorCodes.WCL_RATE_LIMITED,
      details: {
        context: 'wcl-user-profile',
      },
      statusCode: 429,
    } satisfies Partial<AppError>)
  })
})
