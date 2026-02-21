/**
 * Tests for runtime configuration validation.
 */
import { describe, expect, it } from 'vitest'

import { createMockBindings } from '../../test/setup'
import { type AppError, ErrorCodes } from '../middleware/error'
import type { Bindings } from '../types/bindings'
import {
  resetRuntimeConfigValidation,
  validateRuntimeConfig,
} from './runtime-config'

const validPkcs8PrivateKey = `-----BEGIN PRIVATE KEY-----
MIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQDnV3Nn9W/Z7Ymj
w6F3MHg8ssXVLxMBMab2qUzOoXiysTSTQ200WfCzXYvtokYkIRLu8U3ULgWhUM/Y
7zskWr0Kx7WaE8IaekmOguAy+Afby6G43VRwkCXK0DZKTMdlkwtkIW9l1G7lAqjo
Xjse5+fxLLZJbLO82BTus48ev3mLUPuT3dzgYoGpeHfXBzBD82R9lw/xVOnrLDte
PBBHZyJFitJDTEIt5e0eF8o1rhCmnT4L+5a7V6apd6yjDYpY7IkM3Awdg4q5wteS
rumsUzvou0ASqZScoP9OZins8wizX9R8wit/6Xtm0RziN57xGrqN59fTOEb2+Wdk
xlOuDk4tAgMBAAECgf9xaO2qiSfMLibLoZwGUjyfhQR2/hzS+QRg554/rej9sOGV
T/i5MV5OkA2I8YRxMcWWXbVJz0XzTyqVrrHPoKwMHNtqLUV6tXhZ5M8ELZOsrKcb
eWVryT69rlTvF7Solu1+qOVzhjDXE/a583gILqgGE2VJmYCDk2qvmlcPO87Z/Gq8
vVdPVOcbEdmIg3syMFINXszIEYrDAeHR4ICGNKC1U+Lxju5v3ed9zk52JRxYZotu
fzyJ/EITGop/FkZ/OR7QJe9T+8kmHlp/9PnZX9BYsVM6oSut9feX32bwJv63da9y
iiHGNW/hnH8y0GBaZbU2fzl9vVZU4gpEOFqqjfECgYEA9JvtroRr5tsKC7/srC8L
td3gn1Byso25ql0Mt4VCFfnoxPvjDTj1y3Dr8zkQLPUkP4yL4JPuW7F2PPmwOVUf
bS5OtezX/zO1FV18+v2jf1c6V4i5uJM2E2DiRIA8HhnLvvQJKBo0oh59mLSz5EVK
3HKPI5pqEYVfjoEXX6wm1+UCgYEA8h1bHOtrdjeKDQcQSYS/3xancVayo9KjOqn2
mDHplSPybqNQ+9nP0WRUB2XEf8LJytL8HhzCcJVa9AwJIOhEM0Dvw167obEV6b5A
QrYhop6/yx7wEHEucnJufMJG3JaccYQvKYOb8I6aI6xe2/zY7Ck1ImXBTMG5ufym
jDUWKKkCgYEAhKntBrGbM+GoWScGXXxGhaSIpt8i1eQ3xkYhF4eWiAS6UdurEQjL
hkMANTHFrBxoRG8djfetVt2wmvFwuieIm9Z5qgGCRE7u71984UOe4PmWEtN8prZw
paHuFejWshybfD0umilcUnDm/WNEDZHnQBiBuXWOAWKsqMUqwCDGEGECgYEAugYY
JWY0kQYnSc8tkm8uxQew64JDi1+iDsbcMx/WasLN2HgfFwLJjAbcETr9+XP+e5oU
IEbUlpAK7Av7T49mJ0MzdRbqb1eSkJ+e3CL4QOxcTIKezONJXqHRhoX20DHgTc/U
NL9sJy5J/DLKR5hES1919dHc7U7DlsUqafu35NECgYAicPn/Inbh/x8KzuHTasCh
VVjurBAeJM9IPk28SZgNC0rvo4gANFBKXUpzQMLgiptAmClhAaHDGsJxg8IeKOLp
4Zi/2L2xFzpN2zvx/KK1OTiiubbOEVB5Gcwgqspkf0WXcB0JZI68Tk0puom34aXO
+vSZiUimXL+10j22tyYQKA==
-----END PRIVATE KEY-----`

function createDevelopmentBindings(): Bindings {
  return {
    ...createMockBindings(),
    ENVIRONMENT: 'development',
  } as Bindings
}

describe('validateRuntimeConfig', () => {
  it('skips validation for test environment', async () => {
    resetRuntimeConfigValidation()
    const env = createMockBindings()
    env.FIREBASE_PRIVATE_KEY = 'not-a-real-key'

    await expect(validateRuntimeConfig(env)).resolves.toBeUndefined()
  })

  it('rejects placeholder private key values in non-test environments', async () => {
    resetRuntimeConfigValidation()
    const env = createDevelopmentBindings()
    env.FIREBASE_PRIVATE_KEY =
      '-----BEGIN PRIVATE KEY-----\\n...\\n-----END PRIVATE KEY-----\\n'

    await expect(validateRuntimeConfig(env)).rejects.toMatchObject({
      code: ErrorCodes.FIRESTORE_ERROR,
      statusCode: 500,
    } satisfies Partial<AppError>)
  })

  it('rejects malformed private key values in non-test environments', async () => {
    resetRuntimeConfigValidation()
    const env = createDevelopmentBindings()
    env.FIREBASE_PRIVATE_KEY =
      '-----BEGIN PRIVATE KEY-----\\nthis-is-not-valid\\n-----END PRIVATE KEY-----\\n'

    await expect(validateRuntimeConfig(env)).rejects.toMatchObject({
      code: ErrorCodes.FIRESTORE_ERROR,
      statusCode: 500,
    } satisfies Partial<AppError>)
  })

  it('accepts valid pkcs8 private keys in non-test environments', async () => {
    resetRuntimeConfigValidation()
    const env = createDevelopmentBindings()
    env.FIREBASE_PRIVATE_KEY = validPkcs8PrivateKey.replace(/\n/g, '\\n')

    await expect(validateRuntimeConfig(env)).resolves.toBeUndefined()
  })
})
