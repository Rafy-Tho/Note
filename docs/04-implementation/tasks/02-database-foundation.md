# Task 02 - Database Foundation

## Status

Complete

## Objective

Implement the PostgreSQL schema, migrations, constraints, indexes, and development data.

## Depends On

- `01-project-bootstrap.md`
- `../../03-design/02-database.md`

## Checklist

- [x] Create versioned migrations.
- [x] Create users and sessions tables.
- [x] Create notes, notebooks, tags, and note-tags tables.
- [x] Add foreign keys and unique constraints.
- [x] Add note state and revision fields.
- [x] Add ownership and search indexes.
- [x] Add development and test seed data.

## Tests and Evidence

- Migrations succeeded on the local PostgreSQL database, including rollback and reapply.
- Development seed data loaded using the local-only `SEED_PASSWORD` environment variable.
- Integration coverage verified duplicate notebook names and passed against local PostgreSQL.

## Completion Gate

The complete schema can be created from an empty database.
