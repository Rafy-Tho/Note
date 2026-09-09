# Task 06 - Core Notes

## Status

Not Started

## Objective

Implement the basic note workflow and note metadata.

## Depends On

- `05-authorization.md`
- `../../03-design/02-database.md`
- `../../03-design/03-api.md`

## Checklist

- [ ] Create blank and populated notes.
- [ ] View individual notes.
- [ ] List owned notes.
- [ ] Edit title and content.
- [ ] Store creation and modification timestamps.
- [ ] Implement Active, Archived, and Trashed state values.
- [ ] Add note API endpoints.
- [ ] Add the basic notes list and editor shell.

## Tests and Evidence

- Note CRUD tests pass.
- Blank notes are supported.
- Ownership and timestamps are verified.

## Completion Gate

An authenticated user can create, view, and edit only their own notes.
