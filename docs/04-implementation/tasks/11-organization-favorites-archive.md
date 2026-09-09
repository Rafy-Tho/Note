# Task 11 - Organization and Completion Features

## Status

In Progress

## Objective

Implement the remaining P1 organization, Favorites, Archive, and permanent deletion vertical slice.

## Depends On

- `06-core-notes.md`
- `08-trash-recovery.md`
- `09-minimum-tags.md`
- `10-search.md`

## Backend

- [x] Create and rename notebooks.
- [x] Delete notebooks and unassign their notes.
- [x] Move notes between notebooks.
- [x] Favorite and unfavorite notes.
- [x] Archive and unarchive notes.
- [x] Permanently delete Trashed notes after confirmation.

## Frontend

- [x] Add notebook creation, rename, deletion, and note-movement controls.
- [x] Add full tag browsing.
- [x] Add favorite controls and the Favorites view.
- [x] Add archive controls and the Archive view.
- [x] Add confirmed permanent deletion from Trash.
- [x] Handle loading, empty, success, and failure states.

## Integration and Tests

- [x] Connect organization, Favorites, Archive, and deletion UI to the API.
- [ ] Add API, component, ownership, recovery, data-loss, and end-to-end tests.

## Tests and Evidence

- [x] Organization operations preserve ownership and content.
- [x] Favorites and Archive views show only authorized notes.
- [x] Permanent deletion requires confirmation and removes the note.

## Completion Gate

Backend and workspace behavior is implemented. Component/browser verification remains pending.
