# Task 09 - Minimum Tags for Search

## Status

In Progress

## Objective

Implement the minimum tag management vertical slice required by P0 Search.

## Depends On

- `06-core-notes.md`
- `02-database-foundation.md`
- `../../03-design/06-search.md`

## Backend

- [x] Create unique tags per user.
- [x] Assign owned tags to owned notes.
- [x] Remove tag associations.
- [x] Generate searchable tag data.
- [x] Update search data when tag associations change.
- [x] Enforce ownership on tag operations.

## Frontend

- [x] Add tag creation and assignment controls to the note workflow.
- [x] Add tag removal behavior.
- [x] Handle loading, success, and failure states.

## Integration and Tests

- [x] Connect tag controls to the API.
- [ ] Add API, component, ownership, and end-to-end tests.

## Tests and Evidence

- [x] Duplicate tag names are rejected.
- [x] Cross-user tag assignments are rejected.
- [x] Tag data is available to Search.

## Completion Gate

Notes can be indexed and searched by owned tags. Browser and component-level verification remains pending.
