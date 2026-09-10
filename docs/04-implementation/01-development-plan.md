# Development Plan

## Purpose

This document defines the ordered tasks for implementing, testing, and preparing the MVP for release.

## Implementation Rules

- Build small vertical slices.
- Test each feature as it is built.
- Complete security and P0 workflows before P1 features.
- Keep implementation aligned with the approved Design documents.
- Do not implement out-of-scope features. Telegram sign-in and sign-up remain deferred.

## Step 0 - Confirm Tools

Decide and document the package manager, test framework, rich-text editor, local PostgreSQL setup, environment variables, formatter, linter, and migration tool.

**Gate:** Technical choices are recorded before coding begins.

## Step 1 - Bootstrap the Project

Create the React frontend, Node.js/Express backend, environments, scripts, PostgreSQL connection, and health-check endpoint.

**Gate:** Frontend, backend, database connection, and tests run locally.

## Step 2 - Build the Database Foundation

Create migrations, users, sessions, notes, notebooks, tags, note-tags, constraints, ownership indexes, and seed data.

**Gate:** Migrations succeed on a clean database.

## Step 3 - Build the Backend Foundation

Create the Express structure, configuration loading, validation, standard errors, safe logging, data access, and transaction helpers.

**Gate:** The API returns consistent success and error responses.

## Step 4 - Build the Authentication Foundation

Implement registration, Argon2id passwords, sign-in, secure sessions, expiry, revocation, sign-out, CSRF protection, and rate limiting. This step establishes the protected-route foundation; the authentication screens are completed in the Authentication slice.

**Gate:** The API can authenticate users and safely establish and revoke protected sessions.

## Step 5 - Build the Authorization Foundation

Implement authenticated user context, ownership-scoped data-access helpers, protected resource rules, state checks, safe not-found behavior, and cross-user tests. Every later slice must use this foundation.

**Gate:** User A cannot read or modify User B data through any protected API operation.

## Vertical Feature Slices

After the shared foundations, build one complete user-facing capability at a time. A slice is not complete when only its API or only its UI is finished.

For every slice, use this order:

```text
Backend behavior
    -> API contract
    -> Frontend component or screen
    -> API integration
    -> Loading, empty, success, and failure states
    -> Relevant automated tests
    -> Acceptance verification and documentation
```

## Step 6 - Authentication Slice

Complete registration, mandatory email verification, sign-in, sign-out, session-aware routing, authentication forms, validation feedback, protected-route behavior, and end-to-end authentication journeys.

**Gate:** A user can register, sign in, use a protected route, and sign out safely from the supported browsers.

## Step 6A - Authentication Provider Expansion

Implement Brevo-backed email verification and password reset, Google and Facebook authorization-code callbacks, provider identity resolution, authenticated provider linking, collision protection, callback state validation, provider configuration, and restricted access for unverified accounts. Telegram sign-in and sign-up remain future scope.

**Gate:** A user must verify email before accessing private notes; users can safely reset passwords; valid Google and Facebook users can sign in; existing users can link providers without automatic account merging; invalid callbacks and identity collisions are rejected.

## Step 7 - Core Notes Slice

Implement blank and populated note creation, note metadata, list, detail, and update APIs, ownership checks, timestamps, Active/Archived/Trashed state values, the notes list, empty state, note detail, create flow, and the editor shell.

**Gate:** An authenticated user can create, view, list, and edit only their own notes through the working UI.

## Step 8 - Rich Text and Autosave Slice

Implement the approved editor features, safe content handling, searchable plain text, Unsaved Changes/Saving/Saved/Save Failed states, the 800 ms debounce, revisions, stale-save prevention, retries, and failure handling in both API and UI behavior.

**Gate:** Rich text is safe, failed saves retain editor state, and newer content cannot be overwritten by an older save.

## Step 9 - P0 Trash and Restore Slice

Implement normal deletion to Trash, Trash APIs and view, restore to the previous state and notebook when possible, fallback restoration to Active with no notebook, and exclusion from normal lists. Permanent deletion is completed in the organization slice.

**Gate:** A user can delete and restore only owned notes without unintended data loss.

## Step 10 - Minimum Tags Slice

Implement tag creation, per-user uniqueness, assignment, removal, searchable tag data, tag controls, and ownership-aware integration with notes.

**Gate:** A user can manage owned tags on owned notes, and tag data is available to Search.

## Step 11 - P0 Search Slice

Implement PostgreSQL full-text search, title/content/tag search, ownership filtering, Active/Archived filtering, Trash exclusion, ranking, pagination, empty-query handling, empty-result handling, and the search interface.

**Gate:** Search returns correct authorized results within the performance target through the working UI.

## Step 12 - P1 Organization Slice

Implement notebook creation, rename, deletion, note movement, full tag browsing, favorites, Favorites view, archive, Archive view, confirmed permanent deletion, and their complete UI workflows.

**Gate:** P1 organization and recovery behavior works without unintended data loss.

## Step 13 - Cross-Slice UI Integration

Complete shared dashboard and navigation behavior, responsive desktop/tablet/mobile layouts, keyboard behavior, focus management, accessible feedback, consistent loading/empty/error states, and the complete user journey. This step integrates and hardens UI already delivered by the slices; it is not the first frontend implementation step.

**Gate:** The core workflow is usable and accessible on supported desktop and mobile browsers.

## Step 13A - Frontend Routing and Application Context

Implement shared authentication context, React Router route guards, application layouts, authentication URLs, and URL-driven workspace navigation. Track the detailed route map, component boundaries, URL state ownership, and tests in `tasks/12A-frontend-routing-and-context.md`.

**Gate:** Authentication and every supported workspace section are reachable through stable URLs, protected correctly, and preserve unsaved-change behavior.

## Step 13B - Backend Hybrid Structure Refactor

Reorganize the backend into the approved hybrid architecture without changing API contracts or business behavior. Establish the app composition layer, separate shared infrastructure, keep database access under `db`, preserve feature-owned modules, update imports and tests, and verify ownership and authentication behavior after the move.

**Gate:** The target backend structure is implemented, all backend tests and lint checks pass, API behavior is unchanged, and the architecture documentation matches the source tree.

## Step 13C - Frontend Hybrid Structure Refactor

Reorganize the frontend into the approved hybrid architecture. Keep application composition under `app`, feature behavior under `features`, route screens under `pages`, and genuinely reusable presentation and infrastructure under the shared directories. Track the detailed target tree, boundaries, migration checklist, and verification evidence in `tasks/13C-frontend-hybrid-structure.md`.

**Gate:** The target frontend structure is implemented, imports and tests are updated, frontend lint/tests/build pass, and routing, authentication, autosave, and workspace behavior remain unchanged.

## Step 13D - Workspace Performance and UX Hardening

Harden the workspace after cross-slice integration by keeping the workspace shell stable across route changes, loading the Notes list incrementally with `useInfiniteQuery`, eliminating duplicate and looping note requests, preserving drafts during navigation, making query and request lifecycles explicit, reducing editor/list rendering work, and verifying the behavior on supported viewport groups. Track the detailed scope, target route model, API impact, checklist, and acceptance criteria in `tasks/13D-workspace-performance-and-ux.md`.

**Gate:** Workspace navigation does not remount the shell or issue duplicate/looping detail requests, unsaved drafts are never silently replaced, private query data is cleared across sessions, collection payloads are appropriately lightweight, and relevant frontend/backend/browser checks pass.

## Step 13E - Editor Organization Controls

Refine the note editor organization workflow with a compact top context bar for notebook selection, tag assignment, and creation of new notebooks or tags. Keep notebook management available without filling the writing surface, preserve existing ownership and autosave behavior, and document the responsive interaction states in `tasks/13E-editor-organization-controls.md`.

**Gate:** Users can organize an open note from the editor context bar, newly created notebooks and tags are assigned only after successful server confirmation, management controls remain accessible, and frontend checks plus supported viewport verification pass.

## Step 13F - Workspace Dialogs and Toast Feedback

Replace browser-native prompts and confirmations with accessible application dialogs and add workspace-scoped toast feedback for confirmed operations. Preserve unsaved-draft protection, destructive-action confirmation, keyboard focus behavior, responsive touch targets, and the existing inline error states. Track the detailed scope, checklist, and acceptance criteria in `tasks/13F-workspace-dialogs-and-toast-feedback.md`.

**Gate:** No frontend browser-native prompt, confirm, or alert remains; dialog and toast behavior passes frontend checks; confirmed workspace mutations provide accessible feedback; and supported desktop/mobile verification passes.

## Step 14 - Test and Harden

Run unit, integration, API, authorization, rich-text security, autosave, end-to-end, accessibility, performance, backup, and recovery tests. Fix critical defects and regressions.

**Gate:** No critical security, data-loss, performance, or regression issue remains.

## Step 15 - Prepare Deployment

Configure production, secrets, HTTPS, migrations, logging, monitoring, backups, recovery, deployment, and rollback procedures.

**Gate:** The MVP can be deployed and recovered using documented procedures.

## Feature Completion Loop

```text
Review requirements
      -> Implement database behavior when needed
      -> Implement backend behavior and API contract
      -> Implement the frontend component or screen
      -> Integrate the API and UI states
      -> Add relevant tests
      -> Verify acceptance criteria
      -> Update documentation and progress
```

## Technical Spikes

Resolve these before relying on them in product code:

- Rich-text editor and serialization
- Rich-text sanitization
- Session and CSRF behavior
- Email verification delivery and token lifecycle
- Google and Facebook provider callback validation
- PostgreSQL full-text search
- Autosave revision conflicts

A spike must produce a documented decision or disposable prototype.

## Scope Control

New work must be reviewed for MVP value, security impact, effort, dependencies, and testing impact. Work that does not support the MVP moves to future scope.
