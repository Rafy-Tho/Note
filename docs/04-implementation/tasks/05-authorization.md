# Task 05 - Authorization

## Status

Not Started

## Objective

Prevent users from accessing or changing resources they do not own.

## Depends On

- `04-authentication.md`
- `02-database-foundation.md`
- `../../03-design/05-authorization.md`

## Checklist

- [ ] Create authenticated user context middleware.
- [ ] Scope protected queries by user ID.
- [ ] Protect notes, notebooks, tags, sessions, and relationships.
- [ ] Enforce allowed note-state transitions.
- [ ] Add safe not-found behavior.
- [ ] Reject cross-user relationships.

## Tests and Evidence

- User A cannot read User B data.
- User A cannot modify User B data.
- Unauthenticated requests are denied.
- Missing and unauthorized resources do not leak information.

## Completion Gate

Every protected operation has server-side ownership enforcement.
