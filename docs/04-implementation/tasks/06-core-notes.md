# Task 06 - Core Notes

## Status

Not Started

## Objective

Implement the core notes vertical slice, including create, view, list, edit, its API, and working UI.

## Depends On

- `05-authorization.md`
- `../../03-design/02-database.md`
- `../../03-design/03-api.md`

## Backend

- [ ] Create blank and populated notes.
- [ ] View individual notes.
- [ ] List owned notes.
- [ ] Edit title and content.
- [ ] Store creation and modification timestamps.
- [ ] Implement Active, Archived, and Trashed state values.
- [ ] Add note API endpoints.

## Frontend

- [ ] Add the notes list and empty state.
- [ ] Add the note detail view.
- [ ] Add the create-note flow and initial editor shell.
- [ ] Add title and content editing.
- [ ] Handle loading, success, and failure states.

## Integration and Tests

- [ ] Connect the list, detail, create, and edit UI to the note API.
- [ ] Add API, component, and end-to-end tests for the slice.

## Tests and Evidence

- Note create, view, list, and edit tests pass.
- Blank notes are supported.
- Ownership and timestamps are verified.

## Completion Gate

An authenticated user can create, view, and edit only their own notes.
