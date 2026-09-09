# Agent Instructions

## Repository State

- The repository is in implementation Step 2: the React/Vite frontend, Express backend, and PostgreSQL migration scaffold exist; database verification requires the local connection credentials.
- Keep package manager, test frameworks, formatter, linter, migration tool, PostgreSQL setup, and environment variables aligned with `docs/04-implementation/tasks/00-tooling-decisions.md`.
- Follow the ordered gates in `docs/04-implementation/01-development-plan.md`; update status and evidence in `docs/04-implementation/03-progress-tracking.md` as work starts and finishes.

## Architecture And Security

- The approved direction is a JavaScript React frontend, Node.js/Express REST API, and PostgreSQL modular monolith; do not add microservices or other infrastructure without a demonstrated MVP need. strtucture in `docs/03-design/01-architecture.md`
- Keep UI, API, application/business-rule, and data-access responsibilities separate. Database and authorization logic do not belong in UI code.
- Every protected read and write must be scoped to the authenticated user's ownership on the server; the frontend is not a security boundary.
- Use versioned migrations and transactions for related changes. Follow the `/api/v1` JSON response and error shapes defined in `docs/03-design/03-api.md`.
- Use server-managed opaque sessions, Argon2id password hashing, secure cookies, CSRF protection for state-changing requests, and rate limiting for login/registration as defined in `docs/03-design/04-authentication.md`.
- Never log or return passwords, tokens, secrets, private note content, SQL, stack traces, or another user's resource information.

## Verification And Scope

- Build small vertical slices, add tests for the relevant risk, and run formatting, linting, and relevant tests before review once those tools are selected.
- Treat cross-user access, rich-text sanitization, autosave revision conflicts, and data-loss behavior as required security/test concerns.
- Keep implementation within the MVP scope and link work to requirement or acceptance IDs; consult `docs/04-implementation/02-development-standards.md`.

## Stitch UI Reference

- The approved visual reference is Stitch project `3170325016723945626` (Minimalist Note App Design).
- Treat `docs/design/DESIGN.md` as the frontend design-system source of truth for colors, typography, spacing, geometry, component states, responsive behavior, and accessibility.
- Keep `frontend/src/styles/globals.css` as the global stylesheet and define shared visual values in its `:root` CSS custom properties before using them in component rules.
- Use the downloaded screenshots in `frontend/public/stitch/screenshots/` and generated HTML/SVG references in `frontend/public/stitch/code/` when implementing UI tasks.
- Match the Stitch design system's colors, typography, spacing, zero-radius geometry, borders, responsive layouts, and interaction states.
- Do not use screenshots as production UI. Recreate the interface with accessible React components and application data.
- Preserve the product behavior and accessibility requirements in `docs/03-design/08-ui-ux.md`; Stitch is the visual reference, not a replacement for those requirements.

## OpenCode

- `opencode.json` configures the remote Stitch MCP; it requires `STITCH_API_KEY` in the environment when Stitch is used.
