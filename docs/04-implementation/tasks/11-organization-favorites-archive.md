# Task 11 - Organization and Completion Features

## Status

Not Started

## Objective

Implement the remaining P1 organization, Favorites, Archive, and permanent deletion vertical slice.

## Depends On

- `06-core-notes.md`
- `08-trash-recovery.md`
- `09-minimum-tags.md`
- `10-search.md`

## Backend

- [ ] Create and rename notebooks.
- [ ] Delete notebooks and unassign their notes.
- [ ] Move notes between notebooks.
- [ ] Favorite and unfavorite notes.
- [ ] Archive and unarchive notes.
- [ ] Permanently delete Trashed notes after confirmation.

## Frontend

- [ ] Add notebook creation, rename, deletion, and note-movement controls.
- [ ] Add full tag browsing.
- [ ] Add favorite controls and the Favorites view.
- [ ] Add archive controls and the Archive view.
- [ ] Add confirmed permanent deletion from Trash.
- [ ] Handle loading, empty, success, and failure states.

## Integration and Tests

- [ ] Connect organization, Favorites, Archive, and deletion UI to the API.
- [ ] Add API, component, ownership, recovery, data-loss, and end-to-end tests.

## Tests and Evidence

- Organization operations preserve ownership and content.
- Favorites and Archive views show only authorized notes.
- Permanent deletion requires confirmation and removes the note.

## Completion Gate

All P1 organization and recovery behavior works without unintended data loss.
