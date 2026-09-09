# Task 10 - Search

## Status

Not Started

## Objective

Implement the fast, authorized P0 Search vertical slice across Active and Archived notes.

## Depends On

- `06-core-notes.md`
- `08-trash-recovery.md`
- `09-minimum-tags.md`
- `../../03-design/06-search.md`

## Backend

- [ ] Build the searchable text projection.
- [ ] Add the PostgreSQL full-text search vector and GIN index.
- [ ] Search titles, content, and tags.
- [ ] Filter by authenticated user.
- [ ] Include Active and Archived notes only.
- [ ] Exclude Trashed notes.
- [ ] Add ranking and pagination.
- [ ] Add empty-query and empty-result handling.

## Frontend

- [ ] Add the search input and search results view.
- [ ] Add filters, pagination, and result states.
- [ ] Handle empty query, no results, loading, and failure states.

## Integration and Tests

- [ ] Connect search controls to the API.
- [ ] Add API, component, authorization, performance, and end-to-end tests.

## Tests and Evidence

- Title, content, and tag searches pass.
- User A cannot see User B results.
- Trashed notes are excluded.
- Search meets the defined p95 target.

## Completion Gate

Search returns correct authorized results within the performance target.
