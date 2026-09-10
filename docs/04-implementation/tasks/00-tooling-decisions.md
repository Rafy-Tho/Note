# Task 00 - Tooling Decisions

## Status

Complete

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

- Keep application-owned authentication adapters and server-managed opaque sessions backed by PostgreSQL. Provider integrations must not introduce JWT sessions.
- Use Brevo through a backend mail adapter for transactional email verification and password reset messages.
- Add Google and Facebook authorization-code integrations only after provider validation and callback security decisions are recorded.
- Telegram sign-in and sign-up remain deferred.
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

- Runtime: `express`, `pg`, `argon2`, `csrf-sync`, `express-rate-limit`, `jose` for provider ID-token validation, plus the selected Google/Facebook provider clients and Brevo mail adapter after the authentication expansion spike.
- Session handling: implement the application-owned PostgreSQL session middleware; provider adapters must not introduce a second session format or persist raw session identifiers.
- Frontend: React, React DOM, React Router DOM, Vite, and the required Tiptap packages.
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
- `BREVO_API_KEY`
- `BREVO_FROM_EMAIL`
- `BREVO_FROM_NAME`
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, and `GOOGLE_REDIRECT_URI`
- `FACEBOOK_CLIENT_ID`, `FACEBOOK_CLIENT_SECRET`, and `FACEBOOK_REDIRECT_URI`
- `AUTH_CALLBACK_BASE_URL`

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
npm run db:seed
npm run test:db
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
- [x] Record dependency and license decisions after the package manifest is created.

## Required Evidence

- Tool choices recorded in this file.
- Reasons recorded for important dependency choices.
- Installed dependency licenses were reviewed as part of bootstrap; review dependency updates before adoption.
- Commands for install, lint, test, and database setup are defined in the root package scripts and must be verified during bootstrap.

## Completion Gate

This task is complete when all decisions and evidence are recorded and the Development Plan can proceed to Step 1 - Bootstrap the Project.

## Related Documents

- `../01-development-plan.md`
- `../02-development-standards.md`
- `../../03-design/01-architecture.md`
- `../../03-design/04-authentication.md`
- `../../03-design/07-autosave.md`
