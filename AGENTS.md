# AGENTS.md

## Project Overview

pnpm monorepo (Turborepo) for a World of Warcraft combat log threat calculation platform.
The backend API runs on Cloudflare Workers using Hono, and the frontend web app is a React SPA hosted on Firebase Hosting.
All code is TypeScript (strict mode, ESM). Node >= 20 (see `.nvmrc`), pnpm 9.15+.

## Warcraft Logs Domains

Use the correct Warcraft Logs host for the game branch you are inspecting:

- `www.warcraftlogs.com` -> Retail
- `classic.warcraftlogs.com` -> Classic progression (currently Mists of Pandaria)
- `fresh.warcraftlogs.com` -> Anniversary Edition progression (currently Burning Crusade)
- `vanilla.warcraftlogs.com` -> Classic Era (does not progress to Burning Crusade)
- `sod.warcraftlogs.com` -> Season of Discovery

When querying combatant/talent payloads, pick the host intentionally. Payload shape
and talent metadata can differ by host/version.

## Workspace Layout

```
apps/api/               @wcl-threat/api          Cloudflare Worker API (Hono v4)
apps/web/               @wcl-threat/web          Frontend SPA (React + Vite, Firebase Hosting)
packages/shared/        @wcl-threat/shared       Cross-cutting utilities
packages/threat-engine/ @wcl-threat/threat-engine Core threat simulation engine
packages/threat-config/ @wcl-threat/threat-config Per-class threat calculation configs
packages/wcl-types/     @wcl-threat/wcl-types    WCL API type definitions
tooling/typescript-config/                       Shared tsconfig presets
```

## Build & Dev Commands

```bash
pnpm install                                  # Install all dependencies
pnpm build                                    # Build all workspaces (turbo)
pnpm dev                                      # Run dev scripts via Turborepo
pnpm clean                                    # Clean all build artifacts + node_modules
pnpm --filter @wcl-threat/api dev             # Start API dev server (wrangler dev)
pnpm --filter @wcl-threat/web dev             # Start web dev server (vite)
pnpm --filter @wcl-threat/api deploy          # Deploy API to production
pnpm --filter @wcl-threat/api deploy:staging  # Deploy API to staging
```

## Testing

Framework: Vitest.

- API package uses `@cloudflare/vitest-pool-workers` (tests run inside miniflare).
- Web package uses Vitest + React Testing Library for component/integration tests.
- Custom snapshot tests are allowed for `@wcl-threat/threat-engine`, `@wcl-threat/threat-config`, or any tests that assert final augmented events payloads; these are most commonly used in `@wcl-threat/threat-config`.
- End-to-end tests are in Playwright.

```bash
# All tests
pnpm test

# Tests for a specific workspace
pnpm --filter @wcl-threat/api test
pnpm --filter @wcl-threat/web test
pnpm --filter @wcl-threat/threat-engine test
pnpm --filter @wcl-threat/threat-config test
pnpm --filter @wcl-threat/shared test

# API single test file
pnpm --filter @wcl-threat/api exec vitest run src/services/threat.test.ts

# Web single test file
pnpm --filter @wcl-threat/web exec vitest run src/lib/threat-aggregation.test.ts

# Threat engine single test file
pnpm --filter @wcl-threat/threat-engine exec vitest run src/threat-engine.test.ts

# Single test by name pattern
pnpm --filter @wcl-threat/api exec vitest run -t "calculates basic damage threat"
pnpm --filter @wcl-threat/web exec vitest run -t "loads report from pasted url"

# Watch mode
pnpm test:watch
pnpm --filter @wcl-threat/api test:watch
pnpm --filter @wcl-threat/web test:watch
pnpm --filter @wcl-threat/threat-engine test:watch

# Web end-to-end
pnpm --filter @wcl-threat/web e2e
```

Tests are co-located with source (`foo.ts` / `foo.test.ts`).
API test helpers live in `apps/api/test/`. Web test helpers live in `apps/web/src/test/`.
Threat engine test helpers live in `packages/threat-engine/src/test/helpers/`.

## Typecheck & Lint

```bash
pnpm typecheck                            # tsc --noEmit across all workspaces
pnpm lint                                 # eslint src/ across all workspaces
pnpm --filter @wcl-threat/api typecheck   # Typecheck API only
pnpm --filter @wcl-threat/api lint        # Lint API only
pnpm --filter @wcl-threat/web typecheck   # Typecheck web only
pnpm --filter @wcl-threat/web lint        # Lint web only
```

## Frontend Architecture (v0)

- App architecture: Single Page Application (SPA)
- Frontend runtime: React (functional components only)
- Build/dev tool: Vite
- Routing: React Router (data routers + nested routes)
- Server state: TanStack React Query
- Hosting: Firebase Hosting (frontend), Cloudflare Worker API remains backend
- Authentication: Firebase Authentication for office access
- Browser support: modern evergreen browsers only

### Frontend Route Contract

Required routes:

- `/`
- `/report/:reportId`
- `/report/:reportId/fight/:fightId`

Required query params:

- `players`: comma-separated player IDs for deep-link filtering
- `targetId`: selected boss/add target within a fight
- `startMs`: selected chart window start (fight-relative milliseconds)
- `endMs`: selected chart window end (fight-relative milliseconds)

URL behavior rules:

- If `players` is present, filter visible ranking/chart rows to those IDs.
- If `players` is absent, show all players for the current context.
- Unknown/invalid player IDs are ignored (no hard error).
- Unknown/invalid `targetId` falls back to default target selection.
- Invalid or partial time window params fall back to full-fight range.

Route behavior details:

- `/` landing page includes:
  - Input for Warcraft Logs report URL
  - Last 5 loaded reports from local storage
  - Example report links when no history exists
- `/report/:reportId` includes:
  - Link-driven navigation for players and fights (not dropdown-only)
  - Click-through to fight chart and player-focused views
- `/report/:reportId/fight/:fightId` includes:
  - Chart for selected target with all visible player lines by default
  - Player-focused views via `players` query param
  - Link to Warcraft Logs report and direct fight link

### Frontend Data & Caching

- Isolate network requests and response normalization in `apps/web/src/api/`.
- Use React Query for all server-state fetching/caching.
- Prefer fetch-once semantics for static report/fight data.
- Use long `staleTime` and minimal automatic refetching.

React Query defaults for v0:

- `staleTime`: high (for example, 30 minutes+)
- `refetchOnWindowFocus`: `false`
- `refetchOnReconnect`: `false`
- `retry`: conservative (for example, 1 retry)

Client persistence:

- Store last 5 loaded reports in local storage.
- Recent report entries should include enough metadata for relaunch (`reportId`, `title`, `lastOpenedAt`).
- Deduplicate by `reportId`, keep most-recent-first.

### Frontend UI Composition & Behavior

- Functional components only.
- Keep components presentational and typed.
- Move behavior to custom hooks (`useReportData`, `useFightData`, query-param hooks, selectors).
- Keep transforms in hooks/selectors, not inline JSX.

Interaction requirements:

- Avoid dropdown-only navigation for core report/fight discovery.
- For fights with multiple bosses/adds, auto-select default target as enemy with highest accumulated threat.
- Provide explicit target selector control.
- Chart supports selecting partial time window and one-click reset to full range.
- Chart legend is rendered on the right side.
- Double-clicking a legend actor isolates that actor; repeating restores normal visibility behavior.
- Focused-player view renders summary table below chart with total threat, total damage done, total healing done.
- Pet labels include owner attribution in legend/tooltip: `<Pet Name> (<Owner Name>)`.

### Frontend UI Libraries

Selected for v0:

- `shadcn/ui` (Radix primitives) + Tailwind CSS
- Apache ECharts via `echarts-for-react`

Chart requirements:

- Multi-series line chart with high point density.
- Built-in zoom/pan via ECharts `dataZoom`.
- Tooltip shows a single nearest data point (not all points for X).
- Tooltip includes cumulative threat, delta threat, event type, ability name, active multipliers, and formula text.

### Frontend Testing Requirements

- Unit/integration: Vitest + React Testing Library.
- No snapshot tests for unit/component coverage.
- End-to-end: Playwright with mocked/stubbed Warcraft Logs API responses.

Critical e2e flows:

- Load report from pasted Warcraft Logs URL.
- Show example logs when no history exists.
- Persist/show recent history (last 5 reports).
- Navigate report route and render ranked list.
- Navigate fight route and render fight data.
- Auto-select default target and allow target switching.
- Deep-link with `players` and verify filtering.
- Show right-side legend and isolate line on double-click.
- Show single-point tooltip with required event/formula fields.
- Deep-link chart window params and verify initial zoom + reset.

### Frontend App Structure

- `apps/web/src/routes/`
- `apps/web/src/pages/`
- `apps/web/src/components/` (presentational components)
- `apps/web/src/hooks/` (custom hooks for state/effects)
- `apps/web/src/api/` (API client + response mappers)
- `apps/web/src/lib/` (shared frontend utilities)
- `apps/web/src/test/` (test setup/helpers)

## Code Style

### Formatting

- No semicolons
- Single quotes for strings
- Trailing commas on multiline constructs (objects, params, arrays)
- 2-space indentation

### Imports

Order imports in groups separated by blank lines:

1. External packages (`hono`, `vitest`)
2. Workspace packages (`@wcl-threat/wcl-types`, `@wcl-threat/threat-config`)
3. Relative imports (`./types/bindings`, `../middleware/error`)

Use `import type` for type-only imports. Use inline `type` keyword for mixed imports:

```typescript
import {
  type ThreatConfig,
  getActiveModifiers,
} from '@wcl-threat/threat-config'

import type { Bindings, Variables } from './types/bindings'
```

Use relative paths for local imports (the `@/*` alias exists but is not used in practice).

### Naming Conventions

| Element             | Convention | Examples                                              |
| ------------------- | ---------- | ----------------------------------------------------- |
| Files/directories   | kebab-case | `mock-fetch.ts`, `threat-config/`                     |
| Functions           | camelCase  | `calculateThreat`, `createCache`                      |
| Classes             | PascalCase | `AppError`, `WCLClient`, `AuraTracker`                |
| Interfaces/Types    | PascalCase | `ThreatConfig`, `CacheService`, `WCLEvent`            |
| Constants (strings) | UPPER_CASE | `WCL_API_URL`, `REPORT_CODE_REGEX`                    |
| Constants (objects) | camelCase  | `baseThreat`, `exclusiveAuras`                        |
| Enum-like keys      | PascalCase | `ErrorCodes.INVALID_REPORT_CODE`, `Spells.ShieldSlam` |
| Test files          | `.test.ts` | `threat.test.ts`, `warrior.test.ts`                   |

No `I` prefix on interfaces. Use `interface` for object shapes/contracts, `type` for
unions, aliases, and function types.

### Type Rules

- Strict mode: `strict: true`, `noUncheckedIndexedAccess: true`, `noImplicitOverride: true`
- `verbatimModuleSyntax: true` -- `import type` is enforced
- Explicit return types on exported functions and class methods
- Return types may be omitted on short lambdas and internal helpers
- Use `as const` for lookup tables (spell IDs, error codes)
- Generics where appropriate (`get<T>`, `Partial<>` for test factories)

### Domain ID Branding

Use branded types for domain identifiers that cross API/frontend boundaries so IDs are
not accidentally mixed.

- Brand IDs that represent distinct concepts, such as `EncounterId`, `SpellId`,
  `TalentPointId`, `ActorId`, `FightId`, and `ReportId`.
- Apply branding at boundaries: API response mappers, request validators, route param
  parsers, and query-param parsers.
- Keep wire payloads plain (`number`/`string`) and convert to branded types in
  application code after validation/parsing.
- Do not over-brand internal ephemeral values (loop indexes, chart point indexes, local
  counters).

```typescript
type Brand<T, TBrand extends string> = T & { readonly __brand: TBrand }

type EncounterId = Brand<number, 'EncounterId'>
type SpellId = Brand<number, 'SpellId'>
type TalentPointId = Brand<number, 'TalentPointId'>
type ActorId = Brand<number, 'ActorId'>
type FightId = Brand<number, 'FightId'>
type ReportId = Brand<string, 'ReportId'>
```

### Error Handling

Errors are thrown (not returned). Use the `AppError` class with factory functions:

```typescript
throw invalidReportCode(code)
throw fightNotFound(reportCode, fightId)
throw wclApiError(`Failed: ${response.status}`)
```

Error codes live in the `ErrorCodes` const object. The global `errorHandler` middleware
catches `AppError` instances and returns structured JSON responses. Do not use try/catch
in route handlers -- let errors propagate to the global handler.

### Functional Patterns

Prefer functional array operations over imperative for-of loops. Functional patterns are
easier to read, verify, and compose:

```typescript
// Good: functional, composable, explicit intent
const actorsInFight = actors
  .filter((a) => fightActorIds.includes(a.id))
  .map((a) => ({ ...a, class: a.type === 'Player' ? a.subType : null }))

// Good: functional transformation with map + filter
const validEnemies = allEnemies
  .map((npc) => ({ ...npc, name: actorMap.get(npc.id)?.name ?? 'Unknown' }))
  .filter((e) => e.id !== ENVIRONMENT_TARGET_ID)

// Avoid: imperative loop is harder to verify
const actorsInFight = []
for (const actor of actors) {
  if (fightActorIds.includes(actor.id)) {
    actorsInFight.push({
      ...actor,
      class: actor.type === 'Player' ? actor.subType : null,
    })
  }
}
```

Use helper functions for complex filter/map conditions:

```typescript
const isHostileNPC = (npc: FightNPC) => npc.id !== ENVIRONMENT_TARGET_ID
const enrichWithName = (npc: FightNPC, actorMap: Map<number, Actor>) => ({
  ...npc,
  name: actorMap.get(npc.id)?.name ?? 'Unknown',
})

const validEnemies = allEnemies
  .filter(isHostileNPC)
  .map((npc) => enrichWithName(npc, actorMap))
```

### JSDoc & Comments

- Every source file starts with a JSDoc block describing the module
- Exported functions get a short (1-line) JSDoc description
- Use `// ===...===` section separators in type definition and config files
- Inline comments sparingly for domain-specific clarifications
- Test files also get a file-level JSDoc header

## Common Patterns

**Factory functions over constructors:** `createCache()`, `createKVCache()`,
`createMemoryCache()`, error factories, test data factories.

**Configuration-as-data:** Threat configs are declarative objects mapping spell IDs to
formula factories, not imperative if/else chains.

**Discriminated unions:** `WCLEvent` discriminates on `type` field. Use switch/if for
type narrowing.

**Cache-first:** Check cache, fall back to API, cache the result. Cache keys built by
`CacheKeys` helper object.

**Hono routing:** Routes composed via `new Hono()` + `.route()` mounting. Dependencies
flow through Hono context (`c.env`, `c.set()`/`c.get()`).

**Implementation plans:** Include brief code snippets where helpful so proposed changes
have concrete context (function signatures, key conditionals, or data shapes).

**Test patterns:**

- BDD style: `describe`/`it`/`expect` (globals enabled)
- `beforeEach`/`afterEach` for setup/teardown
- Test descriptions are lowercase, starting with verbs
- Factory functions for test data with spread overrides: `{ ...defaults, ...overrides }`
- Integration tests mock `fetch` via `vi.stubGlobal()` and use `app.request()`
- Use custom snapshots when asserting final augmented events payloads (typically in `@wcl-threat/threat-config` tests)

**No class inheritance** (except `AppError extends Error`). Prefer composition and
plain functions. No DI framework -- pass dependencies explicitly.
