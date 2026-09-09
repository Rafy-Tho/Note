# Task 00 - Tooling Decisions

## Status

In Progress

## Objective

Confirm the development tools and dependencies before creating application source code.

## Approved Direction

| Area | Approved direction |
| --- | --- |
| Frontend | React |
| Backend | Node.js with Express.js |
| Language | JavaScript |
| Database | PostgreSQL |
| API | REST over HTTPS |
| Authentication | Server-managed sessions with secure cookies |

## Authentication Decision

- Use Passport.js with `passport-local` for email/password authentication only.
- Keep server-managed opaque sessions backed by PostgreSQL; Passport must not be used to add JWT authentication.
- Defer social login and other Passport strategies beyond the MVP.
- Preserve Argon2id password hashing, CSRF protection, login and registration rate limiting, and server-side ownership checks.

## Tooling Decisions

| Area | Decision | Reason |
| --- | --- | --- |
| Package manager | npm | Matches the Node.js backend direction and avoids adding workspace tooling before it is needed. |
| Frontend build | React with Vite | Provides a small, standard development and production build workflow for the browser app. |
| Testing | Vitest, Supertest, and Playwright | Covers unit/component-adjacent tests, HTTP API/integration tests, and core browser journeys. |
| Rich text | Tiptap | Supports the approved headings, bold, italic, lists, links, and code formatting while allowing controlled document output. |
| Local PostgreSQL | Docker Compose | Makes the database version and local service reproducible without adding a second application runtime. |
| Environment loading | Node.js environment variables with `.env.example` | Keeps secrets outside source control and makes required configuration explicit. |
| Formatting | Prettier | Provides one shared formatter for JavaScript, JSON, Markdown, and configuration files. |
| Linting | ESLint | Provides JavaScript and React-specific static checks. |
| Migrations | `node-pg-migrate` | Keeps PostgreSQL schema changes versioned and executable from npm scripts. |

## Planned Dependencies

- Runtime: `express`, `pg`, `passport`, `passport-local`, `argon2`, `csrf-sync`, and `express-rate-limit`.
- Session handling: implement the application-owned PostgreSQL session middleware; use Passport with `session: false` so Passport does not introduce a second session format or persist raw session identifiers.
- Frontend: React, React DOM, Vite, and the required Tiptap packages.
- Development: Vitest, Supertest, Playwright, ESLint, Prettier, and `node-pg-migrate`.
- Exact versions and license review must be recorded when the package manifest is created; do not install dependencies before that review.

## Environment Contract

The bootstrap step must define development, test, and production values for at least:

- `NODE_ENV`
- `PORT`
- `DATABASE_URL`
- `SESSION_SECRET`
- `SESSION_COOKIE_NAME`
- `CSRF_SECRET` or the equivalent CSRF configuration
- `CORS_ORIGIN` when frontend and API origins differ

Secrets must be supplied through the environment or deployment secret manager and must not be committed.

## Planned Commands

The bootstrap step must expose these npm scripts and verify them on a clean setup:

```text
npm install
npm run dev
npm run build
npm run lint
npm run format
npm run format:check
npm test
npm run test:api
npm run test:e2e
npm run db:migrate
npm run db:rollback
```

The exact script implementation may be finalized with the frontend/backend layout during Step 1. Database commands require the local PostgreSQL Compose service to be running.

## Decisions to Complete

- [x] Choose the package manager.
- [x] Choose the frontend and backend test frameworks.
- [x] Choose the rich-text editor library.
- [x] Choose the local PostgreSQL setup.
- [x] Define development, test, and production environment variables.
- [x] Choose formatting and linting tools.
- [x] Choose the migration tool.
- [ ] Record dependency and license decisions after the package manifest is created.

## Required Evidence

- Tool choices recorded in this file.
- Reasons recorded for important dependency choices.
- No selected dependency has a known blocking security or license issue; verify this when dependencies are selected and before installation.
- Commands for install, lint, test, and database setup are defined; verify the scripts during bootstrap.

## Completion Gate

This task is complete when all decisions and evidence are recorded and the Development Plan can proceed to Step 1 - Bootstrap the Project.

## Related Documents

- `../01-development-plan.md`
- `../02-development-standards.md`
- `../../03-design/01-architecture.md`
- `../../03-design/04-authentication.md`
- `../../03-design/07-autosave.md`
