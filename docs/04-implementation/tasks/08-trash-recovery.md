# Task 08 - Trash and Recovery

## Status

In Progress

## Objective

Implement the P0 Trash and restore vertical slice without unintended data loss.

## Depends On

- `06-core-notes.md`
- `../../03-design/02-database.md`

## Backend

- [x] Move Active and Archived notes to Trash.
- [x] Restore the previous state and notebook when possible.
- [x] Restore to Active with no notebook when necessary.
- [x] Exclude Trashed notes from normal lists.
- [x] Enforce ownership on every operation.

## Frontend

- [x] Add the Trash view.
- [x] Add delete and restore actions with confirmation where required.
- [x] Handle loading, empty, success, and failure states.
- [x] Keep normal lists free of trashed notes.

## Integration and Tests

- [x] Connect Trash actions and views to the API.
- [ ] Add API, component, ownership, recovery, and end-to-end tests.

## Tests and Evidence

- [x] Normal deletion is recoverable through the API and service tests.
- [x] User A cannot view or restore User B's Trash.
- [x] Restore preserves content and organization when available.

## Completion Gate

Trashed notes remain recoverable and isolated by user. Browser end-to-end verification remains pending because the local Playwright Chromium executable is unavailable.
