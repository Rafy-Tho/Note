# Task 13C - Frontend Hybrid Structure

## Status

Complete

## Objective

Reorganize the frontend into a hybrid architecture that combines application infrastructure, feature-owned behavior, and intentionally shared components without changing user behavior, API contracts, routing, authentication, or visual design.

## Depends On

- `12A-frontend-routing-and-context.md`
- `../../03-design/01-architecture.md`
- `../02-development-standards.md`

## Target Boundaries

- `src/app/` owns provider composition, query-client creation, routing, and application layouts.
- `src/features/` owns feature components, hooks, services, validation, and feature tests.
- `src/components/ui/` owns generic reusable controls when introduced.
- `src/components/common/` owns feature-agnostic product components shared across screens.
- `src/pages/` owns thin route-level screen composition.
- `src/lib/` owns shared application infrastructure and transport helpers when needed.
- `src/hooks/`, `src/utils/`, and `src/constants/` contain only code shared by multiple features.
- `src/styles/` owns global styles and shared visual tokens.

Feature services may depend on shared infrastructure, but shared code must not depend on feature internals. No global state library is introduced by this task.

## Checklist

- [x] Add explicit application provider and query-client boundaries.
- [x] Move shared `Alert` and `Brand` components under `components/common`.
- [x] Move feature API modules under feature-owned `services` directories.
- [x] Move authentication validation under the feature `validation` boundary.
- [x] Update source and test imports.
- [x] Preserve route, authentication, CSRF, autosave, and workspace behavior.
- [x] Verify frontend lint, tests, and production build.
- [x] Update progress evidence after verification.

## Verification

```text
npm run lint --workspace frontend
npm test --workspace frontend
npm run build --workspace frontend
```

## Completion Gate

The documented frontend boundaries match the source tree, frontend lint passes, all 9 frontend tests pass, the production build passes, and the structural refactor introduces no behavioral regression in the covered checks.

## Implementation Evidence

- Added `app/providers.jsx` and `app/queryClient.js`.
- Moved shared `Alert` and `Brand` components under `components/common`.
- Moved feature API clients under feature `services` directories.
- Moved authentication validation and tests under `features/auth/validation`.
- Frontend lint passes.
- Frontend Vitest passes with 4 test files and 9 tests.
- Frontend production build passes; Vite reports the existing large-bundle warning.
