# Development Plan

## Purpose

This document defines the ordered tasks for implementing, testing, and preparing the MVP for release.

## Implementation Rules

- Build small vertical slices.
- Test each feature as it is built.
- Complete security and P0 workflows before P1 features.
- Keep implementation aligned with the approved Design documents.
- Do not implement out-of-scope features.

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

Complete registration, sign-in, sign-out, session-aware routing, authentication forms, validation feedback, protected-route behavior, and end-to-end authentication journeys.

**Gate:** A user can register, sign in, use a protected route, and sign out safely from the supported browsers.

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
- PostgreSQL full-text search
- Autosave revision conflicts

A spike must produce a documented decision or disposable prototype.

## Scope Control

New work must be reviewed for MVP value, security impact, effort, dependencies, and testing impact. Work that does not support the MVP moves to future scope.
