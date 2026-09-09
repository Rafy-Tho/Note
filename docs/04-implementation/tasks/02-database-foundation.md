# Task 02 - Database Foundation

## Status

Not Started

## Objective

Implement the PostgreSQL schema, migrations, constraints, indexes, and development data.

## Depends On

- `01-project-bootstrap.md`
- `../../03-design/02-database.md`

## Checklist

- [ ] Create versioned migrations.
- [ ] Create users and sessions tables.
- [ ] Create notes, notebooks, tags, and note-tags tables.
- [ ] Add foreign keys and unique constraints.
- [ ] Add note state and revision fields.
- [ ] Add ownership and search indexes.
- [ ] Add development and test seed data.

## Tests and Evidence

- Migrations succeed on a clean database.
- Rollback or recovery behavior is documented where supported.
- Constraints reject invalid relationships and duplicate values.

## Completion Gate

The complete schema can be created from an empty database.
