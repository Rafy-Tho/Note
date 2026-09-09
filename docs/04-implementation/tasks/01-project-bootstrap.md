# Task 01 - Project Bootstrap

## Status

In Progress

## Objective

Create the initial frontend, backend, database connection, scripts, and local development workflow.

## Depends On

- `00-tooling-decisions.md`

## Checklist

- [x] Create the React frontend.
- [x] Create the Node.js and Express backend.
- [x] Configure development and test environments.
- [x] Add environment example files.
- [x] Add install, run, lint, format, and test scripts.
- [x] Add PostgreSQL connection configuration.
- [x] Add the health-check endpoint.

## Tests and Evidence

- Frontend build and local dev-server startup succeed.
- Backend test suite and local server startup succeed.
- Database connection is blocked because Docker is unavailable and no local PostgreSQL service is configured.
- Unit/API test commands pass; E2E has no journeys yet and passes with `--pass-with-no-tests`.

## Completion Gate

All local development commands work on a clean setup.
