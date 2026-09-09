# System Architecture

## Purpose

This document defines the MVP system structure and boundaries. Detailed schemas, endpoints, authentication rules, search behavior, autosave behavior, and deployment belong in their dedicated documents.

## Architecture Decision

Use a modular monolith:

```text
React Frontend
      |
      | HTTPS / REST
      v
Node.js / Express.js API
      |
      v
PostgreSQL
```

This keeps the MVP simple and maintainable without microservices.

## Repository Structure

Application code lives at the repository root, separate from project documentation:

```text
frontend/
  src/
    app/            Application setup, providers, and routing.
    components/     Reusable presentation components.
    features/       Auth, notes, notebooks, tags, search, and note states.
    hooks/          Shared React hooks.
    lib/            API client and frontend utilities.
    styles/         Global and shared styles.
    test/           Frontend test setup and fixtures.

backend/
  src/
    config/         Environment and application configuration.
    db/             PostgreSQL pool, transactions, and queries.
    middleware/     Authentication, authorization, validation, and errors.
    common/         Shared backend errors, validation, logging, and HTTP helpers.
    modules/        Feature routes, controllers, services, repositories, and schemas.
    routes/         Versioned route composition.
  migrations/       Versioned PostgreSQL migrations.
  test/              Unit, API, integration, security, and fixture support.

e2e/                 Playwright browser journeys and fixtures.
docs/                Requirements, design, implementation plans, and decisions.
```

Keep feature behavior close to its feature module. Keep database access in backend data-access code, business rules in backend application services, and presentation concerns in frontend components.

## Layer Responsibilities

| Layer | Responsibility |
| --- | --- |
| React frontend | Screens, editor state, navigation, loading/error states, responsive UI. |
| API layer | Routing, request validation, authentication context, consistent responses. |
| Application layer | Note, notebook, tag, search, favorite, archive, Trash, and autosave rules. |
| Data-access layer | PostgreSQL queries, transactions, constraints, and indexes. |
| Database | Persistent source of truth for users and application data. |

The frontend is not a security boundary.

## Backend Modules

| Module | Responsibility |
| --- | --- |
| Authentication | Registration, sign-in, sign-out, and sessions. |
| Authorization | Ownership checks for protected operations. |
| Notes | Note content, metadata, and state transitions. |
| Notebooks and tags | Organization and relationships. |
| Favorites and archive | Note collections and state changes. |
| Search | Authorized search of Active and Archived notes. |
| Autosave | Save status and stale-save prevention. |
| Validation and errors | Shared validation and error responses. |

## Protected Request Flow

```text
Request
  -> Authenticate
  -> Validate input
  -> Check ownership
  -> Apply business rule
  -> Read or write database
  -> Return safe response
```

Unauthorized requests must stop before protected data is returned or changed.

## Core Data Flows

### Search

Search validates the query, scopes results to the authenticated user, and searches Active and Archived notes by title, content, and tags. Trashed notes are excluded.

### Autosave

```text
Editor change
  -> Save condition
  -> Authenticated API request
  -> Validate and authorize
  -> Version-aware persistence
  -> Saved or Save Failed
```

Detailed timing, retry, and version rules belong in `07-autosave.md`.

### Note States

```text
Active <-> Archived
  |
  v
Trashed -> Removed
```

Restoring a note returns it to its previous state and notebook when available. Otherwise it returns to Active with no notebook.

## Architectural Rules

1. Business rules are enforced by the backend.
2. Every protected read and write checks ownership.
3. UI code must not contain database or authorization logic.
4. PostgreSQL is the MVP source of truth.
5. Related changes use appropriate transactions.
6. Secrets come from environment or secret-management configuration.
7. Private note content and credentials are never logged.
8. New infrastructure must solve a demonstrated MVP problem.

## Requirement Mapping

| Decision | Requirements |
| --- | --- |
| Server authorization | FR-04, FR-05, FR-43, NFR-09, NFR-10, NFR-34 |
| Modular layers | NFR-24, NFR-26, NFR-27, NFR-28 |
| PostgreSQL source of truth | FR-17-FR-19, NFR-19, NFR-25, NFR-50 |
| Autosave flow | FR-32-FR-36, NFR-06, NFR-17, NFR-20, NFR-35 |
| Filtered data access | FR-28-FR-31, NFR-02, NFR-03, NFR-07, NFR-25 |
| Validation and errors | FR-40-FR-44, NFR-11, NFR-16, NFR-31 |

## Out of Scope

- Microservices
- Dedicated search infrastructure
- Distributed caching
- Collaboration and real-time synchronization
- Offline synchronization
- AI services
- Native mobile applications

## Handoff

The next Design documents are:

1. `02-database.md`
2. `04-authentication.md`
3. `05-authorization.md`
4. `03-api.md`
5. `06-search.md`
6. `07-autosave.md`
7. `08-ui-ux.md`
8. `09-security-threat-model.md`
