# Testing

## Required Coverage

- Unit tests for business rules and validation
- API and integration tests for persistence, errors, and authorization
- Cross-user ownership tests for every protected operation
- Component tests for important UI behavior and state transitions
- Playwright journeys for registration, authentication, notes, autosave, organization, search, trash, and restore
- Rich-text sanitization and malicious markup tests
- Autosave failure, retry, and stale revision tests
- Accessibility, responsive, performance, backup, and recovery checks

## Completion Gate

No critical security, data-loss, performance, or regression issue remains. Required formatting, linting, unit, API, integration, build, and browser checks pass or have a documented blocker.

## Current Blocker

Browser verification is pending because the local Chromium executable is unavailable. This must be resolved before final release verification.
