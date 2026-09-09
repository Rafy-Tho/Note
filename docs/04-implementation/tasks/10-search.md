# Task 10 - Search

## Status

In Progress

## Objective

Implement the fast, authorized P0 Search vertical slice across Active and Archived notes.

## Depends On

- `06-core-notes.md`
- `08-trash-recovery.md`
- `09-minimum-tags.md`
- `../../03-design/06-search.md`

## Backend

- [x] Build the searchable text projection.
- [x] Add the PostgreSQL full-text search vector and GIN index.
- [x] Search titles, content, and tags.
- [x] Filter by authenticated user.
- [x] Include Active and Archived notes only.
- [x] Exclude Trashed notes.
- [x] Add ranking and pagination.
- [x] Add empty-query and empty-result handling.

## Frontend

- [x] Add the search input and search results view.
- [x] Add pagination and result states.
- [x] Handle empty query, no results, loading, and failure states.

## Integration and Tests

- [x] Connect search controls to the API.
- [ ] Add API, component, authorization, performance, and end-to-end tests.

## Tests and Evidence

- [x] Title, content, and tag searches pass.
- [x] User A cannot see User B results.
- [x] Trashed notes are excluded.
- [x] Search meets the defined p95 target in the database integration test.

## Completion Gate

Search returns correct authorized results within the performance target. Browser and component-level verification remains pending.
