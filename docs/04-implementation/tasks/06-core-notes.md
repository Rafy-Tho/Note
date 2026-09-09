# Task 06 - Core Notes

## Status

Complete

## Objective

Implement the core notes vertical slice, including create, view, list, edit, its API, and working UI.

## Depends On

- `05-authorization.md`
- `../../03-design/02-database.md`
- `../../03-design/03-api.md`

## Backend

- [x] Create blank and populated notes.
- [x] View individual notes.
- [x] List owned notes.
- [x] Edit title and content.
- [x] Store creation and modification timestamps.
- [x] Implement Active, Archived, and Trashed state values.
- [x] Add note API endpoints.

## Frontend

- [x] Add the notes list and empty state.
- [x] Add the note detail view.
- [x] Add the create-note flow and initial editor shell.
- [x] Add title and content editing.
- [x] Handle loading, success, and failure states.

## Integration and Tests

- [x] Connect the list, detail, create, and edit UI to the note API.
- [x] Add API, frontend behavior, and end-to-end tests for the slice.

## Tests and Evidence

- Note create, view, list, and edit tests pass.
- Blank notes are supported.
- Ownership and timestamps are verified.

## Completion Gate

An authenticated user can create, view, and edit only their own notes.
