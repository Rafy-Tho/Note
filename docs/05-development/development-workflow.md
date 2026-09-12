# Development Workflow

Build small vertical slices. Within each slice, implement backend behavior, define the API contract, build frontend behavior, handle loading/empty/success/failure states, add tests, verify acceptance criteria, and update documentation.

Review security, ownership, data-loss, accessibility, and responsive behavior before completion. Update `docs/06-implementation/progress.md` with status, evidence, and blockers.

## Emptying Development Data

The backend provides a destructive development/test-only database command. It preserves migration history and refuses production. Run it from `backend/`:

```text
npm run db:empty -- --confirm=EMPTY_DATABASE
```

The command discovers and truncates all user tables in the `public` schema in one transaction. It preserves the `pgmigrations` history table so the schema remains managed. It must never be exposed as an HTTP endpoint or run against production data.
