/**
 * Unit tests for popup callback completion page behavior.
 */
import type { AuthContextValue } from '@/auth/auth-provider'
import { render, screen } from '@testing-library/react'
import { StrictMode } from 'react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  wclAuthPopupResultMessageType,
  wclAuthPopupResultStorageKey,
} from '../auth/wcl-popup-bridge'
import { AuthCompletePage } from './auth-complete-page'

const useAuthMock = vi.fn()

vi.mock('../auth/auth-provider', () => ({
  useAuth: () => useAuthMock(),
}))

function renderPage(initialPath: string): void {
  render(
    <MemoryRouter
      future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
      initialEntries={[initialPath]}
    >
      <Routes>
        <Route path="/auth/complete" element={<AuthCompletePage />} />
      </Routes>
    </MemoryRouter>,
  )
}

function renderPageInStrictMode(initialPath: string): void {
  render(
    <StrictMode>
      <MemoryRouter
        future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
        initialEntries={[initialPath]}
      >
        <Routes>
          <Route path="/auth/complete" element={<AuthCompletePage />} />
        </Routes>
      </MemoryRouter>
    </StrictMode>,
  )
}

function createMockAuthValue(authEnabled: boolean): AuthContextValue {
  return {
    authEnabled,
    authError: null,
    completeBridgeSignIn: vi.fn(),
    isBusy: false,
    isInitializing: false,
    signOut: vi.fn(),
    startWclLogin: vi.fn(),
    user: null,
    wclUserId: null,
    wclUserName: null,
  }
}

describe('AuthCompletePage', () => {
  let originalLocalStorage: Storage
  let originalOpener: Window | null
  let closeSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    vi.useFakeTimers()
    useAuthMock.mockReturnValue(createMockAuthValue(true))
    closeSpy = vi.spyOn(window, 'close').mockImplementation(() => undefined)

    originalLocalStorage = window.localStorage
    const values = new Map<string, string>()
    const mockLocalStorage = {
      clear: (): void => {
        values.clear()
      },
      getItem: (key: string): string | null => values.get(key) ?? null,
      key: (index: number): string | null =>
        Array.from(values.keys())[index] ?? null,
      get length(): number {
        return values.size
      },
      removeItem: (key: string): void => {
        values.delete(key)
      },
      setItem: (key: string, value: string): void => {
        values.set(key, value)
      },
    } satisfies Storage

    Object.defineProperty(window, 'localStorage', {
      configurable: true,
      value: mockLocalStorage,
    })

    originalOpener = window.opener
    Object.defineProperty(window, 'opener', {
      configurable: true,
      value: null,
    })
  })

  afterEach(() => {
    vi.runOnlyPendingTimers()
    vi.useRealTimers()
    vi.restoreAllMocks()
    Object.defineProperty(window, 'localStorage', {
      configurable: true,
      value: originalLocalStorage,
    })
    Object.defineProperty(window, 'opener', {
      configurable: true,
      value: originalOpener,
    })
  })

  it('publishes success payload and closes popup for valid bridge hash', () => {
    renderPage('/auth/complete#bridge=bridge-123')

    const storedPayload = window.localStorage.getItem(
      wclAuthPopupResultStorageKey,
    )
    expect(storedPayload).toBeTruthy()
    expect(JSON.parse(storedPayload ?? '{}')).toMatchObject({
      bridgeCode: 'bridge-123',
      status: 'success',
    })

    vi.advanceTimersByTime(500)
    expect(closeSpy).toHaveBeenCalled()
  })

  it('closes popup when rendered in StrictMode', () => {
    renderPageInStrictMode('/auth/complete#bridge=bridge-123')

    vi.advanceTimersByTime(500)
    expect(closeSpy).toHaveBeenCalled()
  })

  it('publishes error payload when bridge hash is missing', () => {
    renderPage('/auth/complete')

    expect(screen.getByRole('alert')).toHaveTextContent(
      'Missing bridge code in callback URL.',
    )
    const storedPayload = window.localStorage.getItem(
      wclAuthPopupResultStorageKey,
    )
    expect(storedPayload).toBeTruthy()
    expect(JSON.parse(storedPayload ?? '{}')).toMatchObject({
      message: 'Missing bridge code in callback URL.',
      status: 'error',
    })

    vi.advanceTimersByTime(500)
    expect(closeSpy).toHaveBeenCalled()
  })

  it('publishes error payload when auth is disabled', () => {
    useAuthMock.mockReturnValue(createMockAuthValue(false))

    renderPage('/auth/complete#bridge=bridge-123')

    expect(screen.getByRole('alert')).toHaveTextContent(
      'Firebase auth configuration is missing for this environment.',
    )
    const storedPayload = window.localStorage.getItem(
      wclAuthPopupResultStorageKey,
    )
    expect(storedPayload).toBeTruthy()
    expect(JSON.parse(storedPayload ?? '{}')).toMatchObject({
      message: 'Firebase auth configuration is missing for this environment.',
      status: 'error',
    })
  })

  it('posts result to opener window when available', () => {
    const openerPostMessage = vi.fn()
    Object.defineProperty(window, 'opener', {
      configurable: true,
      value: {
        closed: false,
        postMessage: openerPostMessage,
      },
    })

    renderPage('/auth/complete#bridge=bridge-123')

    expect(openerPostMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        result: expect.objectContaining({
          bridgeCode: 'bridge-123',
          status: 'success',
        }),
        type: wclAuthPopupResultMessageType,
      }),
      window.location.origin,
    )
  })

  it('does not close popup when storage publish throws', () => {
    vi.spyOn(window.localStorage, 'setItem').mockImplementation(() => {
      throw new Error('storage blocked')
    })

    renderPage('/auth/complete#bridge=bridge-123')

    vi.advanceTimersByTime(300)
    expect(closeSpy).not.toHaveBeenCalled()
  })
})
