# Backend API Verification Audit Report

**Date**: 2026-02-22
**Scope**: `/apps/api/src/` -- all source and test files
**Status**: Pre-implementation checkpoint
**Test Suite**: 60/60 tests passing (10 test files)

---

## 1. PASS -- Things Correctly Set Up

### 1.1 Clean Code Principles

| Check | Status | Notes |
|-------|--------|-------|
| Intention-revealing names | PASS | `createApp`, `handleShutdown`, `requestIdMiddleware`, `notFoundHandler`, `globalErrorHandler`, `registerRoutes`, `handleHealthCheck` -- all clearly convey intent |
| Functions under 20 lines | PASS | All functions are concise. Longest is `corsMiddleware` at 14 lines in `app.ts`; `logFailedHandlers` at 17 lines in `event-bus.ts`. No violations |
| No magic numbers in source | PASS | `MAX_REQUEST_BODY_SIZE`, `DEFAULT_PORT`, `DEFAULT_API_PREFIX`, `DEFAULT_CORS_ORIGIN`, `REQUEST_ID_HEADER`, `ERROR_EVENT_TYPE` -- all values are named constants |
| Single Responsibility | PASS | Each file does exactly one thing: `app.ts` = factory, `server.ts` = entry point, `environment.ts` = config, `app-error.ts` = error types, etc. |
| No `any` in source code | PASS | Zero `any` types in production source files. Word "any" only appears in documentation comments (e.g., "any pending domain events") |
| Interfaces for contracts | PASS | `DomainEvent`, `EventHandler`, `IEventPublisher`, `AppConfig`, `ErrorResponse` -- proper interface-based contracts |
| Newspaper Metaphor | PASS | `app.ts` reads top-to-bottom: imports, constant, exported factory, private middleware. `error-handler.ts` reads: interface, helpers, exported handler |
| Error handling | PASS | `globalErrorHandler` distinguishes `AppError` from unknown errors. Unknown errors return generic 500. `loadEnvironment` fails fast with `process.exit(1)` on invalid config. No null returns |

### 1.2 Architecture Compliance

| Check | Status | Notes |
|-------|--------|-------|
| `config/` -- configuration only | PASS | Single file `environment.ts` with Zod validation, env loading, and frozen config export |
| `errors/` -- error definitions only | PASS | Single file `app-error.ts` with `ErrorCode` enum and `AppError` class with factory methods |
| `events/` -- event system only | PASS | Four files: `domain-event.ts`, `event-bus.ts`, `aggregate-root.ts`, `event-publisher.ts`, plus barrel `index.ts` |
| `middleware/` -- Express middleware only | PASS | Three files: `request-id.ts`, `not-found.ts`, `error-handler.ts` |
| `routes/` -- route definitions only | PASS | Two files: `index.ts` (route registry), `health.routes.ts` (health endpoint) |
| `app.ts` -- app factory only | PASS | Exports `createApp()` factory, wires middleware and routes, no business logic |
| `server.ts` -- entry point only | PASS | Creates app, starts listener, handles graceful shutdown signals |
| No business logic in routes | PASS | Health route handler returns static system info. No domain operations in controllers |
| Proper dependency direction | PASS | Source files depend inward. No circular dependencies detected |

### 1.3 Event-Driven Architecture

| Check | Status | Notes |
|-------|--------|-------|
| `DomainEvent` has readonly fields | PASS | All four fields (`eventId`, `eventType`, `occurredAt`, `aggregateId`) are declared `readonly` (line 17-26 of `domain-event.ts`) |
| Past-tense naming convention documented | PASS | JSDoc on `DomainEvent` interface: "Naming convention: Use past tense (e.g., 'AppointmentCreated', 'AppointmentCancelled')" (line 9) |
| `TypedEventBus` uses `Promise.allSettled` | PASS | Line 53 of `event-bus.ts`: `const results = await Promise.allSettled(...)` -- NOT `Promise.all`. Design decision documented in class JSDoc |
| `AggregateRoot` collects and clears events | PASS | `addDomainEvent()` pushes to internal array, `pullDomainEvents()` returns a copy and clears the original. Destructive-read is documented (line 28-37 of `aggregate-root.ts`) |
| "Persist first, then publish" documented | PASS | Documented in three places: `DomainEvent` interface JSDoc (line 11), `TypedEventBus.publish()` JSDoc (line 47), and `AggregateRoot` class JSDoc (line 8-14) |
| `IEventPublisher` port abstraction exists | PASS | Interface defined in `event-publisher.ts` (line 14-16) with `InProcessEventPublisher` concrete implementation |
| Error listener on EventBus | PASS | `dispatchToErrorHandlers()` method (line 105-120) dispatches to handlers registered under the `'error'` event type constant |
| Handler independence documented | PASS | JSDoc on `EventHandler` interface (line 7): "Handlers are independent units -- they should not share mutable state". Also documented in `TypedEventBus` class JSDoc |

### 1.4 TDD Infrastructure

| Check | Status | Notes |
|-------|--------|-------|
| Vitest configured correctly | PASS | `vitest.config.mts`: globals enabled, node environment, root `./src`, pattern `**/__tests__/**/*.test.ts`, v8 coverage, `@api` path alias |
| Test helpers use real app | PASS | `test-app.ts` calls `createApp()` (the real factory), not mocks. `createTestRequest()` wraps supertest around a real app instance |
| Each test tests ONE behavior | PASS | All 60 tests are focused. Each `it()` block asserts one clear behavior |
| Test names are descriptive | PASS | Examples: "one handler failure does not prevent other handlers from executing", "pullDomainEvents() returns a copy, not the internal array" |
| No mock-testing | PASS | Tests use real implementations. Only `vi.spyOn(console, 'error')` is used (to suppress noise), not to replace behavior |
| Coverage: health endpoint | PASS | `health.test.ts` -- 6 tests covering status, JSON shape, timestamp, uptime, environment, and request-id header |
| Coverage: error handler | PASS | `error-handler.test.ts` -- 6 tests covering AppError handling, unknown errors, JSON shape, status codes, no stack trace leak |
| Coverage: not-found | PASS | `not-found.test.ts` -- 4 tests covering 404 status, JSON shape, error code, multiple HTTP methods |
| Coverage: request-id | PASS | `request-id.test.ts` -- 4 tests covering header presence, UUID format, uniqueness, and error responses |
| Coverage: config | PASS | `environment.test.ts` -- 6 tests covering all config properties, types, and constraints |
| Coverage: events | PASS | 4 test files (24 tests total) covering `DomainEvent`, `TypedEventBus`, `AggregateRoot`, `InProcessEventPublisher` |

### 1.5 Type Safety

| Check | Status | Notes |
|-------|--------|-------|
| Strict mode | PASS | `tsconfig.base.json` has `"strict": true` |
| Express types augmented | PASS | `types/express.d.ts` augments `Request` with `id: string` |
| Config is frozen/readonly | PASS | `Readonly<AppConfig>` type + `Object.freeze()` at runtime |
| Zod runtime validation | PASS | Environment variables validated with Zod schema at startup, fails fast on invalid input |
| Path aliases configured | PASS | `@api/*`, `@domain/*`, `@application/*`, `@infrastructure/*`, `@shared/*` defined in both `tsconfig.json` and `vitest.config.mts` |

---

## 2. ISSUES -- Problems Found

### ISSUE-1: Unsafe type cast in `TypedEventBus.dispatchToErrorHandlers()`

**File**: `/apps/api/src/events/event-bus.ts`, line 115
**Severity**: Medium

```typescript
handler.handle(errorContext as unknown as DomainEvent);
```

The `errorContext` object (with shape `{ eventType, eventId, handlerIndex, reason }`) is cast through `unknown` to `DomainEvent`. This bypasses TypeScript's type system entirely. The `errorContext` does not have an `occurredAt` or `aggregateId` field, so any error handler that reads those fields will get `undefined` at runtime.

**Recommendation**: Define a dedicated `EventBusError` type that extends or wraps `DomainEvent`, or make error handlers accept a different interface. Alternatively, create a proper `DomainEvent`-shaped error event with all required fields populated.

---

### ISSUE-2: `as any` casts in test file `app-error.test.ts`

**File**: `/apps/api/src/__tests__/errors/app-error.test.ts`, lines 6, 14, 20, 26, 33
**Severity**: Low (test-only)

```typescript
const error = new AppError('Validation failed', 422, 'VALIDATION_ERROR' as any);
```

The `AppError` constructor accepts `ErrorCode` enum, but the tests pass raw strings cast with `as any`. This means the test would still pass even if the `ErrorCode` enum values changed. The tests should use `ErrorCode.VALIDATION_ERROR` (or similar) to maintain type safety.

**Recommendation**: Use `ErrorCode` enum members instead of `as any` casts:
```typescript
const error = new AppError('Validation failed', 422, ErrorCode.VALIDATION_ERROR);
```

Note: `VALIDATION_ERROR` is defined in the `ErrorCode` enum but the constructor test uses `422` as the status code, which is not defined in the `AppError` static factories. This is intentional to test the raw constructor -- but the enum should still be used.

---

### ISSUE-3: `corsMiddleware` defined below its usage in `app.ts`

**File**: `/apps/api/src/app.ts`, lines 14 and 25
**Severity**: Low (cosmetic)

The `corsMiddleware` is used at line 14 (`app.use(corsMiddleware)`) but defined starting at line 25. While JavaScript hoisting makes this work for `const` in this context (since `createApp` is only invoked at runtime, not at module parse time), it breaks the Newspaper Metaphor -- readers see the usage before the definition.

**Recommendation**: Either move `corsMiddleware` above `createApp`, or extract it to a `middleware/cors.ts` file to match the pattern of other middleware.

---

### ISSUE-4: `requestIdMiddleware` uses type assertion instead of augmented type

**File**: `/apps/api/src/middleware/request-id.ts`, line 13
**Severity**: Low

```typescript
(req as Request & { id: string }).id = requestId;
```

The `express.d.ts` type declaration already augments `Request` with `id: string`. This cast is redundant if the type augmentation is properly loaded. If the augmentation is NOT loaded in this file's compilation scope, the cast masks the problem.

**Recommendation**: Remove the cast and rely on the type augmentation directly:
```typescript
req.id = requestId;
```
If TypeScript complains, the type augmentation file needs to be included in the tsconfig's `include` or `files` array.

---

### ISSUE-5: `eslint-disable` comment in type augmentation file

**File**: `/apps/api/src/types/express.d.ts`, line 1
**Severity**: Trivial

```typescript
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Request } from "express";
```

ESLint is not configured in this project (no `.eslintrc` or `eslint.config.*` found). The disable comment is dead code.

**Recommendation**: Remove the comment once ESLint is not being used, or add ESLint to the project before implementation begins.

---

### ISSUE-6: `TestAggregate.emitEvent()` is a test-only public wrapper around protected method

**File**: `/apps/api/src/__tests__/events/aggregate-root.test.ts`, line 11
**Severity**: Low (acceptable pattern)

```typescript
class TestAggregate extends AggregateRoot {
  emitEvent(event: DomainEvent): void {
    this.addDomainEvent(event);
  }
}
```

This is a test-only subclass that exposes the `protected addDomainEvent()`. This is the standard pattern for testing abstract classes in TypeScript. Documenting it here for completeness -- no action needed unless a better pattern is preferred.

---

### ISSUE-7: `error-handler.test.ts` environment mutation test is fragile

**File**: `/apps/api/src/__tests__/middleware/error-handler.test.ts`, lines 71-84
**Severity**: Low

```typescript
it('does not include stack trace in production mode', async () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    try { ... } finally {
      process.env.NODE_ENV = originalEnv;
    }
});
```

This test mutates `process.env.NODE_ENV` but the `config` object is already frozen at module load time via `Object.freeze()`. Changing `process.env.NODE_ENV` does NOT change `config.isDevelopment` (which the error handler actually checks). The test passes because the error handler skips the `console.error` log in non-development mode, but the test's intent does not match the mechanism.

**Recommendation**: This test should verify the behavior through the already-computed `config.isDevelopment` flag, or the error handler should be refactored to accept config as a parameter for testability.

---

## 3. MISSING -- Things Needed Before Implementation

### MISSING-1: Package `src/` directories are empty

**Severity**: Blocking

All four monorepo packages have `package.json` and `tsconfig.json` but NO `src/` directory or any source files:

- `/packages/domain/src/` -- does not exist
- `/packages/application/src/` -- does not exist
- `/packages/infrastructure/src/` -- does not exist
- `/packages/shared/src/` -- does not exist

The `tsconfig.json` in each package references `"include": ["src"]` but the directory does not exist.

**Action**: Create `src/` directories with at least an `index.ts` barrel export in each package.

---

### MISSING-2: No barrel exports (`index.ts`) in packages

**Severity**: Blocking

No `index.ts` files exist in any package's `src/` directory. The API's `tsconfig.json` defines path aliases (`@domain/*`, `@application/*`, etc.) but there is nothing to import.

**Action**: Create `src/index.ts` in each package as the public API surface.

---

### MISSING-3: Package `package.json` files are scaffolds

**Severity**: Medium

All four package `package.json` files are bare npm-init scaffolds:
```json
{
  "name": "domain",
  "main": "index.js",
  "scripts": { "test": "echo \"Error: no test specified\" && exit 1" }
}
```

Missing:
- `"private": true` (monorepo packages should not be published)
- TypeScript as a devDependency
- Vitest configuration
- Proper `"main"` pointing to `src/index.ts` or `dist/index.js`
- Missing workspace protocol dependencies (e.g., `application` should depend on `@domain`)

**Action**: Update all package `package.json` files with correct fields, dependencies, and scripts.

---

### MISSING-4: No shared types/constants package content

**Severity**: Medium

The `packages/shared/` package exists but has no content. Per the architecture plan, all packages may import from `shared`. Common types, constants, and utilities should be defined here before domain implementation begins.

Likely needed:
- `Result<T, E>` type (for use case returns)
- `UniqueId` value object or type
- Common constants (e.g., `PAGINATION_DEFAULTS`)
- Base repository interface patterns

**Action**: Populate `packages/shared/src/` with foundational types.

---

### MISSING-5: Event system lives in `apps/api/src/events/` but belongs in `packages/domain/`

**Severity**: Medium (architectural)

Per the architecture plan, domain events, `AggregateRoot`, and the `DomainEvent` interface are part of the **Domain Layer** (`packages/domain`). Currently they live inside `apps/api/src/events/`.

The `IEventPublisher` port should live in `packages/application/` (as a port interface). The `InProcessEventPublisher` concrete implementation should live in `packages/infrastructure/` or `apps/api/`.

**Current location**: `/apps/api/src/events/`
**Correct location per architecture**:
- `DomainEvent`, `createEventId`, `AggregateRoot` -> `packages/domain/src/events/`
- `IEventPublisher` -> `packages/application/src/ports/`
- `EventHandler`, `TypedEventBus`, `InProcessEventPublisher` -> `packages/infrastructure/src/events/` or `apps/api/src/events/`

**Action**: Move event files to their proper architectural layers when packages are scaffolded. The current placement is acceptable as a development starting point but should be relocated.

---

### MISSING-6: No logger abstraction

**Severity**: Low (pre-implementation)

`server.ts` and `error-handler.ts` use `console.log` / `console.error` directly. `TypedEventBus` also logs to `console.error`. Before implementation, a logger interface should be defined so that logging can be swapped (e.g., to pino, winston) without touching business code.

**Action**: Create an `ILogger` interface in `packages/shared/` or `packages/application/` and inject it where needed.

---

### MISSING-7: No CORS middleware file

**Severity**: Low

CORS handling is an inline `const` inside `app.ts` rather than a dedicated file in `middleware/`. As the CORS configuration grows (per-route origins, credentials, preflight caching), having it inline will bloat `app.ts`.

**Action**: Extract `corsMiddleware` to `middleware/cors.ts` for consistency with the other middleware files.

---

### MISSING-8: No `@types/node` in API package dependencies

**Severity**: Low

The API uses `crypto.randomUUID()`, `process.env`, `process.exit()`, `process.uptime()`, `process.on()` but `@types/node` is not listed in `package.json` devDependencies. It may be hoisted from root or inherited, but explicit declaration is safer.

**Action**: Add `@types/node` to the API's `devDependencies`.

---

## 4. RECOMMENDATIONS -- Non-Blocking Improvements

### REC-1: Add `AppError` factory for `validationError()`

The `ErrorCode.VALIDATION_ERROR` enum value exists but there is no corresponding static factory method on `AppError`. This will be needed immediately when Zod request validation is added.

```typescript
static validationError(message = "Validation failed", details?: unknown): AppError {
  return new AppError(message, StatusCodes.UNPROCESSABLE_ENTITY, ErrorCode.VALIDATION_ERROR, true, details);
}
```

---

### REC-2: Add `publishAll()` method to `IEventPublisher`

Currently, `IEventPublisher` only has `publish(event)` for single events. When `AggregateRoot.pullDomainEvents()` returns an array, the caller must loop. A `publishAll(events: DomainEvent[])` convenience method would reduce boilerplate in repositories/services.

---

### REC-3: Consider typed event registration

The current `TypedEventBus.register(eventType: string, handler)` uses a raw string for event type matching. A stricter approach would use a generic type parameter tied to the event class, preventing registration mismatches at compile time.

---

### REC-4: Add `supertest` / `@types/supertest` to package.json

`supertest` is listed but `@types/supertest` types version should stay in sync. Currently `@types/supertest: ^6.0.3` with `supertest: ^7.2.2` -- verify type compatibility. Major version mismatch (6 vs 7) may cause type errors as the API grows.

---

### REC-5: Add test setup file for common configuration

Currently, `vitest.config.mts` has no `setupFiles`. As tests grow, a shared setup file (e.g., `__tests__/setup.ts`) would be useful for:
- Suppressing `console.error` globally in tests
- Setting `NODE_ENV=test` reliably
- Common test fixtures

---

### REC-6: Consider `express-async-errors` or async wrapper

Express 4.x does not catch async errors by default. While Express 5.x (which this project uses: `express@^5.2.1`) does handle async middleware natively, this should be explicitly verified in integration tests with an async route that throws.

---

### REC-7: Add unhandled rejection handler in `server.ts`

The server handles `SIGTERM` and `SIGINT` for graceful shutdown but does not handle `unhandledRejection` or `uncaughtException`. These should log and exit with a non-zero code.

```typescript
process.on('unhandledRejection', (reason) => {
  console.error('[API] Unhandled rejection:', reason);
  process.exit(1);
});
```

---

## Summary

| Category | Pass | Issues | Missing | Recommendations |
|----------|------|--------|---------|-----------------|
| Clean Code | 8/8 | 2 minor | 0 | 0 |
| Architecture | 9/9 | 1 cosmetic | 1 major | 1 |
| Event-Driven | 8/8 | 1 medium | 1 relocation | 2 |
| TDD | 10/10 | 2 low | 0 | 2 |
| Type Safety | 5/5 | 1 low | 1 low | 1 |
| Packages | -- | 0 | 5 blocking/medium | 1 |

**Overall Assessment**: The API foundation is well-crafted with strong adherence to clean code principles, proper TDD practices, and a correct event-driven architecture implementation. All 60 tests pass. The primary gap is the empty monorepo packages -- `packages/domain/`, `packages/application/`, `packages/infrastructure/`, and `packages/shared/` need to be scaffolded with source directories, barrel exports, and proper configuration before feature implementation can begin. The event system code currently in `apps/api/src/events/` will need to be relocated to its architecturally correct layers.

**Verdict**: Ready for implementation after resolving MISSING-1 through MISSING-5.
