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

## Step 4 - Implement Authentication

Implement registration, Argon2id passwords, sign-in, secure sessions, expiry, revocation, sign-out, CSRF protection, and rate limiting.

**Gate:** Users can authenticate and access protected routes safely.

## Step 5 - Implement Authorization

Implement authenticated user context, ownership-scoped queries, protected resources, state checks, safe not-found behavior, and cross-user tests.

**Gate:** User A cannot read or modify User B data.

## Step 6 - Implement Core Notes

Implement blank note creation, viewing, listing, editing, metadata, note API endpoints, state values, and the basic notes UI.

**Gate:** An authenticated user can create, view, and edit only their own notes.

## Step 7 - Implement Rich Text and Autosave

Implement the approved editor features, safe content handling, searchable plain text, save states, 800 ms debounce, revisions, stale-save prevention, retries, and failure handling.

**Gate:** Rich text is safe and newer content cannot be overwritten by an older save.

## Step 8 - Implement P0 Trash and Restore

Implement normal deletion to Trash, Trash view, restore to the previous state and notebook when possible, and fallback restoration to Active with no notebook.

Permanent deletion is completed later with P1 organization work.

**Gate:** Trashed notes remain recoverable and are isolated by user.

## Step 9 - Implement Minimum Tag Support for Search

Implement tag creation, uniqueness, assignment, removal, and searchable tag data. Full tag browsing can be completed later.

**Gate:** Notes can be indexed and searched by owned tags.

## Step 10 - Implement P0 Search

Implement PostgreSQL full-text search, title/content/tag search, ownership filtering, Active/Archived filtering, Trash exclusion, ranking, pagination, and empty-query/result handling.

**Gate:** Search returns authorized results within the performance target.

## Step 11 - Implement P1 Organization and Completion Features

Implement notebook creation, rename, deletion, note movement, full tag browsing, favorites, Favorites view, archive, Archive view, and confirmed permanent deletion.

**Gate:** All P1 organization and recovery behavior works without unintended data loss.

## Step 12 - Complete the UI/UX

Complete the dashboard, navigation, loading/empty/error states, responsive layouts, keyboard behavior, focus management, and accessible feedback.

**Gate:** The core workflow works on supported desktop and mobile browsers.

## Step 13 - Test and Harden

Run unit, integration, API, authorization, rich-text security, autosave, end-to-end, accessibility, performance, backup, and recovery tests. Fix critical defects and regressions.

**Gate:** No critical security, data-loss, performance, or regression issue remains.

## Step 14 - Prepare Deployment

Configure production, secrets, HTTPS, migrations, logging, monitoring, backups, recovery, deployment, and rollback procedures.

**Gate:** The MVP can be deployed and recovered using documented procedures.

## Feature Completion Loop

```text
Review requirements
      -> Implement database and backend behavior
      -> Implement API contract
      -> Implement frontend behavior
      -> Add tests
      -> Verify acceptance criteria
      -> Update documentation
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
