# Task 08 - Trash and Recovery

## Status

Not Started

## Objective

Implement the P0 Trash and restore workflow without unintended data loss.

## Depends On

- `06-core-notes.md`
- `../../03-design/02-database.md`

## Checklist

- [ ] Move Active and Archived notes to Trash.
- [ ] Add the user's Trash view.
- [ ] Restore the previous state and notebook when possible.
- [ ] Restore to Active with no notebook when necessary.
- [ ] Exclude Trashed notes from normal lists.
- [ ] Enforce ownership on every operation.

## Tests and Evidence

- Normal deletion is recoverable.
- User A cannot view or restore User B's Trash.
- Restore preserves content and organization when available.

## Completion Gate

Trashed notes remain recoverable and isolated by user.
