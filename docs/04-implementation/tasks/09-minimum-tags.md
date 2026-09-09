# Task 09 - Minimum Tags for Search

## Status

Not Started

## Objective

Implement the minimum tag management vertical slice required by P0 Search.

## Depends On

- `06-core-notes.md`
- `02-database-foundation.md`
- `../../03-design/06-search.md`

## Backend

- [ ] Create unique tags per user.
- [ ] Assign owned tags to owned notes.
- [ ] Remove tag associations.
- [ ] Generate searchable tag data.
- [ ] Update search data when tag associations change.
- [ ] Enforce ownership on tag operations.

## Frontend

- [ ] Add tag creation and assignment controls to the note workflow.
- [ ] Add tag removal behavior.
- [ ] Handle loading, success, and failure states.

## Integration and Tests

- [ ] Connect tag controls to the API.
- [ ] Add API, component, ownership, and end-to-end tests.

## Tests and Evidence

- Duplicate tag names are rejected.
- Cross-user tag assignments are rejected.
- Tag data is available to Search.

## Completion Gate

Notes can be indexed and searched by owned tags.
