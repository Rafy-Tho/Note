# Task 08 - Trash and Recovery

## Status

Not Started

## Objective

Implement the P0 Trash and restore vertical slice without unintended data loss.

## Depends On

- `06-core-notes.md`
- `../../03-design/02-database.md`

## Backend

- [ ] Move Active and Archived notes to Trash.
- [ ] Restore the previous state and notebook when possible.
- [ ] Restore to Active with no notebook when necessary.
- [ ] Exclude Trashed notes from normal lists.
- [ ] Enforce ownership on every operation.

## Frontend

- [ ] Add the Trash view.
- [ ] Add delete and restore actions with confirmation where required.
- [ ] Handle loading, empty, success, and failure states.
- [ ] Keep normal lists free of trashed notes.

## Integration and Tests

- [ ] Connect Trash actions and views to the API.
- [ ] Add API, component, ownership, recovery, and end-to-end tests.

## Tests and Evidence

- Normal deletion is recoverable.
- User A cannot view or restore User B's Trash.
- Restore preserves content and organization when available.

## Completion Gate

Trashed notes remain recoverable and isolated by user.
