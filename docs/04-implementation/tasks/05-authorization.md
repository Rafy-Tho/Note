# Task 05 - Authorization

## Status

In Progress

## Objective

Build the server-side authorization foundation used by every vertical feature slice.

## Depends On

- `04-authentication.md`
- `02-database-foundation.md`
- `../../03-design/05-authorization.md`

## Backend Foundation

- [x] Create authenticated user context middleware.
- [x] Scope protected queries by user ID.
- [ ] Protect notes, notebooks, tags, sessions, and relationships in their feature slices.
- [x] Enforce allowed note-state transitions.
- [x] Add safe not-found behavior.
- [x] Reject cross-user relationships.

## Slice Integration

- [x] Provide reusable ownership checks to feature services and routes.
- [x] Require every protected slice to use authenticated user context.
- [ ] Verify authorization behavior through the frontend-backed API flows.

## Tests and Evidence

- [x] User A cannot read User B data.
- [x] User A cannot modify User B data.
- [x] Unauthenticated requests are denied.
- [x] Missing and unauthorized resources do not leak information.

## Completion Gate

The reusable authorization foundation is implemented and verified with protected API fixtures. Resource-specific notes, notebooks, tags, and frontend-backed flows must use this foundation as their feature slices are built.
