# Current Tasks - Medical Scheduling Platform

## In Progress

### Phase 0: Project Foundation & Infrastructure Setup

- [ ] **P0-T3**: Configure shared package (`@msp/shared`) - types, constants, Result<T,E>
- [ ] **P0-T4**: Configure domain package (`@msp/domain`) - directory scaffolding, barrel exports
- [ ] **P0-T5**: Configure application package (`@msp/application`) - directory scaffolding
- [ ] **P0-T6**: Configure infrastructure package (`@msp/infrastructure`) - deps, scaffolding
- [ ] **P0-T7**: Configure API app with package references
- [ ] **P0-T8**: Verify monorepo build pipeline

### Blockers (Pre-Phase 0)

- [ ] Create `pnpm-workspace.yaml` (pnpm requires this, not package.json workspaces)
- [ ] Fix all package names to use `@msp/` scope
- [ ] Add proper `main`, `types`, build scripts to all packages
