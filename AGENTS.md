# Agent Instructions

## Repository State

- The repository is in implementation Step 13I: the React/Vite frontend, Express backend, MySQL migrations, authentication, notes, organization, search, and workspace integration exist; browser verification still requires the local Chromium executable.
- Read `SPEC.md` before making product or architecture changes. It is the concise product contract; detailed decisions belong in the relevant document under `docs/`.
- `frontend/` and `backend/` are independent npm projects with their own `package.json`, `package-lock.json`, `node_modules/`, and environment files. There is no root package or workspace; run install, scripts, and tests from the relevant app directory.
- Keep package manager, test frameworks, formatter, linter, migration tool, MySQL setup, and environment variables aligned with `docs/05-development/tech-stack.md` and `docs/05-development/dependencies.md`.
- Follow the ordered gates in `docs/06-implementation/implementation-plan.md`; update status and evidence in `docs/06-implementation/progress.md` as work starts and finishes.

## Architecture And Security

- The approved direction is a JavaScript React frontend, Node.js/Express REST API, and MySQL modular monolith; do not add microservices or other infrastructure without a demonstrated MVP need. Structure is defined in `docs/04-design/architecture.md`.
- Keep UI, API, application/business-rule, and data-access responsibilities separate. Database and authorization logic do not belong in UI code.
- Every protected read and write must be scoped to the authenticated user's ownership on the server; the frontend is not a security boundary.
- Use versioned migrations and transactions for related changes. Follow the `/api/v1` JSON response and error rules defined in `docs/04-design/api.md`.
- Use server-managed opaque sessions, Argon2id password hashing, secure cookies, CSRF protection for state-changing requests, and rate limiting for login/registration as defined in `docs/04-design/security.md`.
- Never log or return passwords, tokens, secrets, private note content, SQL, stack traces, or another user's resource information.

## Verification And Scope

- Build small vertical slices, add tests for the relevant risk, and run formatting, linting, and relevant tests before review once those tools are selected.
- Add new approved capabilities as documents under `docs/06-implementation/vertical-slices/` or extend the closest existing slice; do not assume the initial slice list is closed.
- Do not add user-profile functionality, or any other out-of-scope feature, without an explicit scope decision recorded in `SPEC.md` and `docs/02-requirements/`.
- Treat cross-user access, rich-text sanitization, autosave revision conflicts, and data-loss behavior as required security/test concerns.
- Keep implementation within the MVP scope and link work to requirement or acceptance IDs; consult `docs/05-development/coding-standards.md`.

## Stitch UI Reference

- The approved visual reference is Stitch project `3170325016723945626` (Minimalist Note App Design).
- Treat `docs/04-design/design-system/DESIGN.md` and the existing Stitch references as the source of truth for colors, typography, spacing, geometry, component states, responsive behavior, and accessibility.
- Keep `frontend/src/styles/globals.css` as the global stylesheet and define shared visual values in its `:root` CSS custom properties before using them in component rules.
- Use the downloaded screenshots in `frontend/public/stitch/screenshots/` and generated HTML/SVG references in `frontend/public/stitch/code/` when implementing UI tasks.
- Match the Stitch design system's colors, typography, spacing, zero-radius geometry, borders, responsive layouts, and interaction states.
- Do not use screenshots as production UI. Recreate the interface with accessible React components and application data.
- Preserve the product behavior and accessibility requirements in `docs/02-requirements/acceptance-criteria.md`; Stitch is the visual reference, not a replacement for those requirements.

## OpenCode

- `opencode.json` configures the remote Stitch MCP; it requires `STITCH_API_KEY` in the environment when Stitch is used.
