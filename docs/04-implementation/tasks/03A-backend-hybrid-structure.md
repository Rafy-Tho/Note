# Task 03A - Backend Hybrid Structure

## Status

Complete

## Objective

Reorganize the backend into a hybrid architecture that combines layered infrastructure with feature-based modules. This is a structural refactor and must not change API contracts, authorization behavior, persistence behavior, or security controls.

## Depends On

- `03-backend-foundation.md`
- `../../03-design/01-architecture.md`

## Target Boundaries

- `src/app/` owns Express composition, global middleware setup, and API route registration.
- `src/config/` owns environment and application configuration.
- `src/common/` owns reusable errors, middleware, validation, logging, response helpers, and utilities.
- `src/db/` owns PostgreSQL pool, queries, transactions, and seed support.
- `src/modules/` owns feature behavior. Each module keeps its routes, controllers, services, repositories, validation, and feature-specific adapters together.
- `src/server.js` remains the process entry point and shutdown owner.

## Checklist

- [x] Add the app composition layer.
- [x] Move shared middleware, errors, validation, logging, and response helpers into common subdirectories.
- [x] Move authentication provider adapters into the auth module.
- [x] Update source and test imports.
- [x] Verify lint and all backend tests.
- [x] Confirm no API or security behavior changed.
- [x] Update architecture and progress evidence.

## Completion Gate

Backend lint passes and all 18 test files pass with 78 tests. The source tree follows the documented boundaries, and the existing authentication, ownership, error, and data-access behavior remains covered.
