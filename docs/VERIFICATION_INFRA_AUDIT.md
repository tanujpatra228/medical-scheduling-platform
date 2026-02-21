# Infrastructure, DevOps & Developer Experience Audit

**Date**: 2026-02-22
**Auditor**: Pre-implementation verification gate
**Project**: Medical Scheduling Platform (Monorepo)
**Commit**: `c22b85a` (main branch, clean working tree)

---

## STATUS SUMMARY

| Area | Status | Details |
|------|--------|---------|
| Docker Setup | **MISSING** | No `docker-compose.yml` exists. No Dockerfiles found. |
| Environment Files | **PARTIAL** | Only `apps/api/.env.example` exists with 4 of ~15+ required variables. |
| Monorepo Configuration | **PARTIAL** | Root `package.json` uses `workspaces` field (npm-style), but pnpm requires `pnpm-workspace.yaml`. Lockfile only covers root deps. Packages are not linked. |
| Package Readiness (domain) | **MISSING** | `src/` directory exists but is empty. No `index.ts` barrel export. `package.json` missing `types` field and scoped name. |
| Package Readiness (application) | **MISSING** | `src/` directory exists but is empty. No `index.ts` barrel export. `package.json` missing `types` field and scoped name. |
| Package Readiness (infrastructure) | **MISSING** | `src/` directory exists but is empty. No `index.ts` barrel export. `package.json` missing `types` field and scoped name. |
| Package Readiness (shared) | **MISSING** | `src/` directory exists but is empty. No `index.ts` barrel export. `package.json` missing `types` field and scoped name. |
| API Backend | **READY** | Express app with middleware, routes, tests (60/60 passing), Vitest, Zod validation. Well-structured. |
| Frontend Setup | **PARTIAL** | Vite + React + TailwindCSS v4 + shadcn configured. Missing React Router and TanStack Query. No pages/layouts/hooks directories. |
| Git Configuration | **READY** | `.gitignore` is comprehensive and correct. |
| CI/CD Pipeline | **MISSING** | No `.github/workflows/` directory. No pipeline defined. |
| Developer Experience | **PARTIAL** | `pnpm dev` starts both apps (with warnings). Tests work. README exists but references `npm` not `pnpm`. |
| Node.js Version | **BLOCKED** | Running v20.18.0 but Vite v7 requires v20.19+ or v22.12+. |

---

## CRITICAL BLOCKERS

These items **MUST** be fixed before feature implementation can begin.

### 1. No `docker-compose.yml` -- Cannot Start Local Database or Redis

**Impact**: Developers cannot run PostgreSQL or Redis locally. All database-dependent features are blocked.

**Evidence**:
```
$ find . -name "docker-compose*"
# (no results)
```

Docker and Docker Compose are installed on the system:
```
Docker version 27.4.1
docker-compose version 1.29.2
```

**Required**: Create `/docker-compose.yml` with:
- PostgreSQL 16 container (port 5432, volume persistence, healthcheck)
- Redis 7 container (port 6379)
- Shared network for service communication

---

### 2. pnpm Workspaces Not Configured -- Packages Are Isolated

**Impact**: The 4 shared packages (`domain`, `application`, `infrastructure`, `shared`) are NOT part of the pnpm workspace graph. Cross-package imports will fail. The `workspace:*` protocol cannot be used.

**Evidence**:
```
$ pnpm ls -r --depth 0
WARN  The "workspaces" field in package.json is not supported by pnpm.
      Create a "pnpm-workspace.yaml" file instead.
ERROR  undefined is not a function
```

The root `package.json` uses npm-style `"workspaces"` field, but pnpm ignores this and requires a separate `pnpm-workspace.yaml` file.

Additionally, the `pnpm-lock.yaml` at root only contains 3 devDependencies (`@types/node`, `ts-node-dev`, `typescript`) -- the workspace packages and apps are not represented in it at all. Each app (`api`, `web`) has its own independent `pnpm-lock.yaml`, meaning they are NOT operating as a unified workspace.

**Required**: Create `/pnpm-workspace.yaml`:
```yaml
packages:
  - 'apps/*'
  - 'packages/*'
```

After creating this file, run `pnpm install` from root to generate a unified lockfile that includes all workspaces. Remove the individual `pnpm-lock.yaml` files from `apps/api/` and `apps/web/`.

---

### 3. Node.js Version Too Old for Vite v7

**Impact**: Vite outputs a warning on startup. May cause runtime issues or crashes with newer Vite features.

**Evidence**:
```
$ node --version
v20.18.0

apps/web dev: You are using Node.js 20.18.0. Vite requires Node.js
              version 20.19+ or 22.12+.
```

**Required**: Upgrade Node.js to at least v20.19.0 (LTS patch) or preferably v22.x (current LTS). Consider adding an `.nvmrc` or `engines` field to enforce this.

---

### 4. All Shared Packages Are Empty Shells

**Impact**: The Clean Architecture layer packages exist as directories but contain zero source files. No barrel exports (`index.ts`) exist. No code can be imported from `@domain/*`, `@application/*`, `@infrastructure/*`, or `@shared/*`.

**Evidence**:
```
$ ls packages/domain/src/
# (empty)
$ ls packages/application/src/
# (empty)
$ ls packages/infrastructure/src/
# (empty)
$ ls packages/shared/src/
# (empty)
```

**Required**: At minimum, create `src/index.ts` in each package as a barrel export placeholder. Fix `package.json` in each package (see Gaps section).

---

## GAPS

These items are missing but can be addressed during Phase 0 setup.

### 5. Package `package.json` Files Are Incomplete

All four packages have nearly identical, minimal `package.json` files:

**Current** (`packages/domain/package.json`):
```json
{
  "name": "domain",
  "version": "1.0.0",
  "main": "index.js",
  "scripts": {
    "test": "echo \"Error: no test specified\" && exit 1"
  }
}
```

**Issues**:
- `name` should be scoped (e.g., `@medical-scheduling/domain`) for workspace protocol
- `main` points to `index.js` but output will be in `dist/` (per tsconfig `outDir`)
- Missing `types` field for TypeScript consumers
- No `build` script defined
- No dev dependencies (no TypeScript, no test runner)
- `test` script just echoes an error

**Required for each package**:
```json
{
  "name": "@medical-scheduling/domain",
  "version": "1.0.0",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "scripts": {
    "build": "tsc",
    "dev": "tsc --watch",
    "test": "vitest run",
    "clean": "rm -rf dist"
  }
}
```

---

### 6. Environment Variables Significantly Incomplete

**Current** (`apps/api/.env.example`):
```
PORT=3001
NODE_ENV=development
API_PREFIX=/api/v1
CORS_ORIGIN=*
```

**Missing variables needed per architecture plan**:
| Category | Variables | Status |
|----------|-----------|--------|
| Database | `DB_HOST`, `DB_PORT`, `DB_USERNAME`, `DB_PASSWORD`, `DB_NAME` | MISSING |
| Redis | `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD` (optional) | MISSING |
| JWT | `JWT_SECRET`, `JWT_EXPIRES_IN`, `JWT_REFRESH_EXPIRES_IN` | MISSING |
| Email/SMTP | `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD` | MISSING |
| Google Calendar | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI` | MISSING |
| Root `.env.example` | Does not exist | MISSING |
| Web `.env.example` | Does not exist | MISSING |

The Zod environment schema in `apps/api/src/config/environment.ts` also only validates the 4 existing variables. It needs to be extended as new env vars are added.

---

### 7. Frontend Missing Key Dependencies

Per the architecture plan, the frontend requires:

| Dependency | Status | Notes |
|------------|--------|-------|
| React Router | **NOT INSTALLED** | Needed for client-side routing (mentioned in README tech stack) |
| TanStack Query | **NOT INSTALLED** | Needed for server state management (mentioned in README tech stack) |
| Axios / fetch wrapper | **NOT INSTALLED** | No API client setup exists |

The `apps/web/package.json` has no routing or data-fetching libraries.

---

### 8. Frontend Project Structure Incomplete

**Current structure** (`apps/web/src/`):
```
src/
  App.tsx            -- renders ComponentExample
  main.tsx           -- React root
  index.css          -- Tailwind theme
  assets/
    react.svg
  components/
    component-example.tsx
    example.tsx
    ui/              -- 14 shadcn components
  lib/
    utils.ts         -- cn() utility
```

**Missing directories needed**:
- `pages/` or `routes/` -- for page components
- `layouts/` -- for layout wrappers
- `hooks/` -- for custom React hooks (referenced in `components.json` aliases)
- `services/` or `api/` -- for API client
- `stores/` or `contexts/` -- for state management
- `types/` -- for shared TypeScript types

---

### 9. No CI/CD Pipeline

**Evidence**:
```
$ ls .github/workflows/
# (directory does not exist)
```

The README describes a CI/CD flow (push -> test -> build -> deploy) but no pipeline is implemented. This can be deferred past Phase 0 but should be created before the first deployment.

---

### 10. No Production Dockerfiles

No `Dockerfile` exists for either `apps/api` or `apps/web`. These are needed for the deployment strategy described in the README (Dockerized services). Can be deferred until deployment phase.

---

### 11. `tsconfig.base.json` Missing Common Options

**Current**:
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Node",
    "strict": true,
    "baseUrl": ".",
    "paths": { ... }
  }
}
```

**Missing recommended options**:
- `esModuleInterop: true` -- needed for CommonJS interop (API's tsconfig adds this itself)
- `skipLibCheck: true` -- speeds up compilation (API's tsconfig adds this itself)
- `declaration: true` -- needed for package consumers
- `declarationMap: true` -- enables IDE go-to-definition into source
- `sourceMap: true` -- needed for debugging
- `forceConsistentCasingInFileNames: true` -- prevents cross-platform issues

These options are partially set in `apps/api/tsconfig.json` but should be centralized in the base.

---

### 12. README References Wrong Package Manager

The README setup instructions say:
```bash
npm install
npm run dev
```

But the project uses pnpm (as declared in `package.json` via `"packageManager": "pnpm@8.0.0"`). This should be:
```bash
pnpm install
pnpm dev
```

---

## READY

These items are properly set up and verified working.

### API Backend (apps/api)
- Express.js v5 application with clean architecture
- `createApp()` factory pattern for testability
- Configuration via Zod-validated environment variables
- Middleware stack: JSON parsing, CORS, request ID, 404 handler, global error handler
- Custom `AppError` class with HTTP status codes
- Health check endpoint at `/api/v1/health`
- Domain event system (`DomainEvent`, `EventBus`, `AggregateRoot`, `EventPublisher`)
- Vitest test suite: **60 tests, all passing**
- Test helper with `createTestApp()` using supertest
- `vitest.config.mts` properly configured with path aliases
- `tsconfig.json` extends base, has path aliases for all packages

### Git Configuration
- `.gitignore` is comprehensive and correct:
  - `node_modules/`, `.pnpm-store/`
  - `dist/`, `build/`, `coverage/`
  - `.env` and `.env.*` (with `!.env.example` exception)
  - `.DS_Store`, IDE directories
  - Docker override files
  - PEM/key/cert files

### Frontend Base Setup
- Vite v7 with React v19 and TypeScript
- TailwindCSS v4 integrated via `@tailwindcss/vite` plugin
- shadcn/ui configured with `components.json` (radix-nova style, lucide icons)
- 14 UI components pre-installed in `src/components/ui/`:
  - `alert-dialog`, `badge`, `button`, `card`, `combobox`, `direction`, `dropdown-menu`, `field`, `input-group`, `input`, `label`, `select`, `separator`, `textarea`
- `cn()` utility function in `lib/utils.ts`
- ESLint configured with React hooks and refresh plugins
- CSS theme with light/dark mode variables, Inter font

### TypeScript Configuration
- Base `tsconfig.base.json` with path aliases for all 4 packages
- API `tsconfig.json` extends base, adds `esModuleInterop`, `resolveJsonModule`, `skipLibCheck`
- API has ts-node configuration for CommonJS module output (needed by ts-node-dev)
- Web uses Vite's project reference pattern (`tsconfig.json` -> `tsconfig.app.json` + `tsconfig.node.json`)

### Developer Workflow (Partial)
- `pnpm dev` from root starts both API and web servers simultaneously (via `pnpm -r --parallel dev`)
- API runs on port 3001 with ts-node-dev (hot reload)
- Web runs on port 5173 with Vite dev server
- `pnpm test` available for API (vitest)
- `pnpm build` and `pnpm lint` scripts defined at root

---

## ACTION ITEMS

Ordered by priority. Items 1-4 are **required before implementation** begins.

### Phase 0: Critical (Must Fix First)

#### 1. Create `pnpm-workspace.yaml` at project root
**File**: `/pnpm-workspace.yaml`
```yaml
packages:
  - 'apps/*'
  - 'packages/*'
```
Then:
```bash
rm apps/api/pnpm-lock.yaml apps/web/pnpm-lock.yaml
pnpm install  # regenerates unified lockfile
```

#### 2. Create `docker-compose.yml` at project root
**File**: `/docker-compose.yml`
```yaml
version: '3.8'

services:
  postgres:
    image: postgres:16-alpine
    container_name: medical-scheduling-db
    restart: unless-stopped
    ports:
      - "5432:5432"
    environment:
      POSTGRES_USER: medical_user
      POSTGRES_PASSWORD: medical_password
      POSTGRES_DB: medical_scheduling
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U medical_user -d medical_scheduling"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    container_name: medical-scheduling-redis
    restart: unless-stopped
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  postgres_data:
  redis_data:

networks:
  default:
    name: medical-scheduling-network
```

#### 3. Upgrade Node.js to v20.19+ or v22.x
```bash
nvm install 22
nvm use 22
# or update .nvmrc
echo "22" > .nvmrc
```
Also add to root `package.json`:
```json
"engines": {
  "node": ">=20.19.0"
}
```

#### 4. Fix all shared package configurations

For **each** of `domain`, `application`, `infrastructure`, `shared`:

**a. Update `package.json`** (example for domain):
```json
{
  "name": "@medical-scheduling/domain",
  "version": "1.0.0",
  "private": true,
  "main": "src/index.ts",
  "types": "src/index.ts",
  "scripts": {
    "build": "tsc",
    "dev": "tsc --watch",
    "clean": "rm -rf dist"
  }
}
```

**b. Create `src/index.ts`** barrel export:
```typescript
// Barrel export for @medical-scheduling/domain
// Entities, value objects, and domain services will be exported here
export {};
```

Repeat for all 4 packages with appropriate scoped names:
- `@medical-scheduling/domain`
- `@medical-scheduling/application`
- `@medical-scheduling/infrastructure`
- `@medical-scheduling/shared`

### Phase 0: Important (Should Fix Before Feature Work)

#### 5. Expand `.env.example` files

**a. Update `/apps/api/.env.example`**:
```env
# Server Configuration
PORT=3001
NODE_ENV=development

# API Settings
API_PREFIX=/api/v1
CORS_ORIGIN=http://localhost:5173

# Database (PostgreSQL)
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=medical_user
DB_PASSWORD=medical_password
DB_NAME=medical_scheduling

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT Authentication
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Email (SMTP) - placeholder for Phase 2
# SMTP_HOST=
# SMTP_PORT=
# SMTP_USER=
# SMTP_PASSWORD=
# SMTP_FROM=noreply@medical-scheduling.example

# Google Calendar - placeholder for Phase 3
# GOOGLE_CLIENT_ID=
# GOOGLE_CLIENT_SECRET=
# GOOGLE_REDIRECT_URI=
```

**b. Create `/apps/web/.env.example`**:
```env
VITE_API_URL=http://localhost:3001/api/v1
```

**c. Create root `/.env.example`**:
```env
# Docker Compose environment
POSTGRES_USER=medical_user
POSTGRES_PASSWORD=medical_password
POSTGRES_DB=medical_scheduling
REDIS_PORT=6379
```

#### 6. Install missing frontend dependencies
```bash
cd apps/web
pnpm add react-router@7 @tanstack/react-query
```

#### 7. Create frontend directory structure
```bash
mkdir -p apps/web/src/pages
mkdir -p apps/web/src/layouts
mkdir -p apps/web/src/hooks
mkdir -p apps/web/src/services
mkdir -p apps/web/src/types
```

#### 8. Enhance `tsconfig.base.json`
Add commonly needed options to the base config:
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Node",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "forceConsistentCasingInFileNames": true,
    "baseUrl": ".",
    "paths": {
      "@domain/*": ["packages/domain/src/*"],
      "@application/*": ["packages/application/src/*"],
      "@infrastructure/*": ["packages/infrastructure/src/*"],
      "@shared/*": ["packages/shared/src/*"]
    }
  }
}
```

#### 9. Fix README setup instructions
Update the Local Development section to reference `pnpm` instead of `npm`:
```bash
cp .env.example .env
cp apps/api/.env.example apps/api/.env
docker compose up -d
pnpm install
pnpm dev
```

### Phase 1: Nice to Have (Can Be Done Incrementally)

#### 10. Create `.nvmrc` at project root
```
22
```

#### 11. Create basic CI/CD pipeline
**File**: `/.github/workflows/ci.yml`
- Lint check
- TypeScript build check
- Unit tests
- (Later: integration tests, Docker build)

#### 12. Create production Dockerfiles
- `apps/api/Dockerfile` -- multi-stage build for Node.js backend
- `apps/web/Dockerfile` -- multi-stage build with Nginx for static files

#### 13. Add `cors` package to API
Currently, CORS is implemented manually in `app.ts`. Consider using the `cors` npm package for more robust handling (credentials, preflight caching, etc.).

---

## VERIFICATION COMMANDS RUN

| Command | Result |
|---------|--------|
| `docker --version` | Docker 27.4.1 -- OK |
| `docker-compose --version` | 1.29.2 -- OK |
| `pnpm --version` | 8.0.0 -- OK (warns about missing workspace yaml) |
| `node --version` | v20.18.0 -- NEEDS UPGRADE |
| `pnpm ls -r --depth 0` | FAILED -- workspaces not configured |
| `pnpm install` (root) | Succeeds (only root deps, warns about workspaces) |
| `pnpm dev` (root) | Starts both apps (API on :3001, Web on :5173) with warnings |
| `pnpm test` (apps/api) | **60 tests passed** -- OK |
| `find . -name "docker-compose*"` | No results -- MISSING |
| `find . -name "Dockerfile*"` | No results -- MISSING |
| `ls .github/workflows/` | Does not exist -- MISSING |

---

## SUMMARY

The project has a solid API backend foundation with good test coverage and clean code patterns. However, the infrastructure and DevOps layer has significant gaps. The most critical issue is the **broken pnpm workspace configuration** -- without `pnpm-workspace.yaml`, the monorepo packages cannot reference each other, which fundamentally blocks the Clean Architecture approach where `apps/api` imports from `@domain/*`, `@application/*`, etc.

The second critical blocker is the **missing Docker Compose** setup. Without local PostgreSQL and Redis, no database-dependent feature can be developed or tested.

**Estimated effort to reach implementation-ready state**: 2-4 hours for items 1-9.
