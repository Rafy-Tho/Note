# API Design

## Purpose

This document defines the MVP REST API structure, endpoint behavior, payload rules, and error format.

## API Rules

- Base path: `/api/v1`
- Format: JSON for requests and responses
- Authentication: secure session cookie
- State-changing requests require CSRF protection
- All private resources are scoped to the authenticated user
- The API never returns passwords, session tokens, or private data from another user

## Response Format

Successful responses use:

```json
{
  "data": {}
}
```

Collection responses use:

```json
{
  "data": [],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 0
  }
}
```

Errors use:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "The request is invalid.",
    "fields": {}
  }
}
```

Error messages must not expose SQL, stack traces, secrets, or another user's resource information.

## Status Codes

| Status | Use |
| --- | --- |
| 200 | Successful read or update. |
| 201 | Successful creation. |
| 204 | Successful operation with no response body. |
| 400 | Invalid request or validation failure. |
| 401 | Missing or invalid authentication. |
| 404 | Missing or inaccessible resource. |
| 409 | Duplicate data or stale revision conflict. |
| 429 | Rate limit exceeded. |
| 500 | Unexpected server failure. |

## Authentication Endpoints

| Method | Path | Purpose |
| --- | --- | --- |
| POST | `/auth/register` | Create an account. |
| POST | `/auth/login` | Create an authenticated session. |
| GET | `/auth/:provider/start` | Start Google or Facebook authorization. |
| GET | `/auth/:provider/callback` | Validate the provider callback and create or resolve a session. |
| POST | `/auth/email/verify` | Consume a verification token and verify the account email. |
| POST | `/auth/email/verification/resend` | Request a new verification message. |
| POST | `/auth/password/reset/request` | Request a password-reset message with a generic response. |
| POST | `/auth/password/reset/confirm` | Consume a valid reset token and set a new password. |
| GET | `/auth/identities` | List the current user's linked providers. |
| POST | `/auth/identities/:provider/link` | Start linking Google or Facebook to the current account. |
| DELETE | `/auth/identities/:provider` | Unlink a provider when another sign-in method remains. |
| POST | `/auth/logout` | Revoke the current session. |
| GET | `/auth/session` | Return the current authentication state. |

Registration, password login, and password reset validate their inputs. New accounts remain restricted until email verification succeeds. Password-reset request responses are generic and never disclose account existence. Provider callbacks use server-side state and authorization-code validation. Login failures use generic error responses. Authenticated session responses include a short-lived-use CSRF token for state-changing requests; they never include the opaque session token, provider tokens, or password-reset tokens.

## Note Endpoints

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/notes` | List the user's notes with state and organization filters. |
| POST | `/notes` | Create a blank or populated note. |
| GET | `/notes/:noteId` | View one owned note. |
| PATCH | `/notes/:noteId` | Update title or content and perform autosave persistence. |
| DELETE | `/notes/:noteId` | Move an owned Active or Archived note to Trash. |
| GET | `/trash` | List the user's Trashed notes. |
| POST | `/notes/:noteId/restore` | Restore an owned Trashed note. |
| DELETE | `/notes/:noteId/permanent` | Permanently delete an owned Trashed note. |
| POST | `/notes/:noteId/archive` | Archive an owned Active note. |
| POST | `/notes/:noteId/unarchive` | Unarchive an owned Archived note. |
| GET | `/favorites` | List the user's favorite notes. |
| POST | `/notes/:noteId/favorite` | Mark an owned note as favorite. |
| DELETE | `/notes/:noteId/favorite` | Remove the favorite state. |

## Organization Endpoints

### Notebooks

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/notebooks` | List the user's notebooks. |
| POST | `/notebooks` | Create a notebook. |
| PATCH | `/notebooks/:notebookId` | Rename an owned notebook. |
| DELETE | `/notebooks/:notebookId` | Delete a notebook and unassign its notes. |
| PUT | `/notes/:noteId/notebook` | Assign an owned note to an owned notebook or null. |

### Tags

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/tags` | List the user's tags. |
| POST | `/tags` | Create a unique tag for the user. |
| POST | `/notes/:noteId/tags` | Assign an owned tag to an owned note. |
| DELETE | `/notes/:noteId/tags/:tagId` | Remove a tag association. |
| GET | `/tags/:tagId/notes` | List the user's notes for a tag. |

## Search Endpoint

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/search` | Search owned Active and Archived notes by title, content, and tags. |

Query parameters:

```text
q       required search text
page    optional page number, default 1
limit   optional page size, default 20, maximum 100
```

Trashed notes are not returned by this endpoint. An empty query returns a validation error and never performs an unrestricted search.

## Note Update and Autosave

`PATCH /notes/:noteId` accepts only supported fields:

```json
{
  "title": "Updated title",
  "contentJson": {},
  "revision": 3
}
```

The server shall:

1. Authenticate and authorize the note.
2. Validate the title and rich-text document.
3. Compare the submitted revision with the stored revision.
4. Reject a stale revision with `409 CONFLICT`.
5. Persist the update and increment the revision atomically.
6. Return the new revision and modification timestamp.

## Pagination and Filtering

Collection endpoints use `page` and `limit`. The maximum page size is 100.

Supported note filters may include:

- `state=active`
- `state=archived`
- `notebookId`
- `favorite=true`

The server applies ownership filtering before all other filters.

## Validation and Ownership

- Validate route IDs, query parameters, request bodies, title/content sizes, notebook names, and tag names.
- Verify ownership for every resource and relationship involved in a request.
- Return `404` for missing or inaccessible resources where disclosure would be unsafe.
- Do not trust user-provided `userId` values; derive ownership from the session.

## Transactions

Use a transaction for:

- Account creation.
- Note state changes.
- Notebook deletion and note unassignment.
- Tag assignment or removal.
- Autosave updates and revision increments.
- Permanent note deletion and association cleanup.

## Requirement Mapping

| API decision | Requirements |
| --- | --- |
| Authentication and protected routes | FR-01-FR-05, FR-37-FR-39, NFR-09 |
| Note and organization endpoints | FR-06-FR-27 |
| Search | FR-28-FR-31, NFR-03, NFR-07 |
| Autosave updates | FR-32-FR-36, NFR-17, NFR-20, NFR-35 |
| Validation and errors | FR-40-FR-44, NFR-11, NFR-16, NFR-31 |
| Pagination and response performance | NFR-02, NFR-04, NFR-05 |
