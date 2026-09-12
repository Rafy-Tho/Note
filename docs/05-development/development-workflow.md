# Development Workflow

Build small vertical slices. Within each slice, implement backend behavior, define the API contract, build frontend behavior, handle loading/empty/success/failure states, add tests, verify acceptance criteria, and update documentation.

Review security, ownership, data-loss, accessibility, and responsive behavior before completion. Update `docs/06-implementation/progress.md` with status, evidence, and blockers.

## Emptying Development Data

The backend provides a destructive development/test-only database command. It preserves migration history and refuses production. Run it from `backend/`:

```text
npm run db:empty -- --confirm=EMPTY_DATABASE
```

The command discovers all user tables in the current database schema through `information_schema.tables` and truncates them with foreign key checks disabled. It preserves the `schema_migrations` history table so the schema remains managed. MySQL truncation and DDL are not fully transactional, so the command is development/test-only and must never be exposed as an HTTP endpoint or run against production data.
