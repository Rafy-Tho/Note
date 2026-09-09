# Authorization Design

## Purpose

This document defines how the server decides whether an authenticated user may access or change a resource.

Authentication answers **who the user is**. Authorization answers **what that user may do**.

## Authorization Decision

Use server-side ownership authorization for every protected operation.

```text
Authenticated user_id
        |
        v
Load resource with ownership condition
        |
        v
Allow operation or return safe denial
```

The frontend must never be treated as a security boundary.

## Ownership Model

| Resource | Owner |
| --- | --- |
| Note | `notes.user_id` |
| Notebook | `notebooks.user_id` |
| Tag | `tags.user_id` |
| Session | `sessions.user_id` |
| Note-tag association | Owner of both the note and tag |

Every resource query must include the authenticated user's ownership condition where applicable.

## Protected Operations

Authorization is required for:

- Viewing, creating, editing, archiving, favoriting, trashing, restoring, and deleting notes.
- Viewing, creating, renaming, deleting, and selecting notebooks.
- Creating, viewing, assigning, removing, and browsing tags.
- Viewing favorites, Archive, Trash, and search results.
- Autosaving note changes.

## Relationship Checks

Operations involving multiple resources must verify all resources belong to the same user.

Examples:

- Moving a note requires ownership of the note and target notebook.
- Assigning a tag requires ownership of the note and tag.
- Browsing by tag filters through the authenticated user's tag.
- Restoring or permanently deleting a note requires ownership of the Trashed note.

## Note-State Authorization

The server must validate both ownership and allowed state transitions:

| Operation | Allowed state |
| --- | --- |
| Archive | Active |
| Unarchive | Archived |
| Move to Trash | Active or Archived |
| Restore | Trashed |
| Permanent delete | Trashed |
| Edit content | Active or Archived |

Favorite and notebook/tag operations must also reject inaccessible or permanently removed notes.

## Request Flow

```text
Read authenticated user_id
        v
Validate resource identifiers
        v
Query resource with user_id condition
        v
Validate state and operation
        v
Execute transaction
        v
Return result
```

Do not load a resource by ID first and check ownership later when a scoped query can perform both checks safely.

## Denial and Not-Found Behavior

- Unauthenticated requests return the authentication-required response defined by the API design.
- Missing or unauthorized resources use the same safe not-found behavior where possible.
- Denial responses must not reveal another user's resource content, owner, state, or existence.
- Unauthorized writes must not modify any data.

## Backend Structure

Authorization should be applied at two levels:

1. **Request protection:** authenticate the session before protected routes.
2. **Resource protection:** scope every application query and mutation to the authenticated user.

Route protection alone is insufficient because resource ownership must also be checked inside application operations.

## Testing Requirements

At minimum, test these cases for every protected resource type:

| Scenario | Expected result |
| --- | --- |
| User A accesses User A resource | Allowed. |
| User A changes User A resource | Allowed when state rules permit it. |
| User A accesses User B resource | Denied without data disclosure. |
| User A changes User B resource | Denied and unchanged. |
| Unauthenticated request | Denied. |
| Missing resource identifier | Safe not-found response. |
| Cross-user note/notebook or note/tag relationship | Denied and unchanged. |

## Requirement Mapping

| Authorization decision | Requirements |
| --- | --- |
| Protected resources | FR-04, FR-05, FR-43, NFR-09, NFR-10 |
| Resource ownership | FR-17, FR-20, FR-24, NFR-34 |
| State transitions | FR-09-FR-16, NFR-19, NFR-21 |
| Safe denial behavior | FR-44, NFR-16 |
| Security testing | NFR-33-NFR-35 |

## Out of Scope

- Shared resources
- Public notes
- Team or organization roles
- Fine-grained collaboration permissions
- Delegated access
