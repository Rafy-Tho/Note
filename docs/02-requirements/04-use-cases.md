# Use Cases

Use cases describe the main interactions between actors and the system. They define behavior, not APIs, database tables, components, or libraries.

## Common Rules

- Private use cases require an authenticated user.
- The server verifies ownership before every protected operation.
- Invalid input is rejected before persistence.
- Failed operations do not report success or leave unintended partial state.
- Missing or unauthorized resources do not reveal protected information.

## Actors

| Actor | Role |
| --- | --- |
| Unauthenticated visitor | Registers or signs in. |
| Authenticated user | Uses their own notes and organization features. |
| Application | Validates, authorizes, persists, retrieves, and reports results. |

## Authentication

### UC-01 - Register Account

| Field | Description |
| --- | --- |
| Actor | Unauthenticated visitor |
| Preconditions | Registration is available. |
| Main flow | Submit email and password; system validates them; system creates a unique account; system confirms registration. |
| Alternatives | Missing, invalid, or duplicate account data is rejected with a correction message. |
| Failure | A service failure creates no partial account and reports failure. |
| References | FR-01, FR-40, FR-42; US-01 |

### UC-02 - Sign In

| Field | Description |
| --- | --- |
| Actor | Unauthenticated visitor |
| Preconditions | A registered account exists. |
| Main flow | Submit credentials; system validates and authenticates them; system creates the authenticated state; dashboard becomes available. |
| Alternatives | Invalid or incomplete credentials are rejected. |
| Failure | Authentication service failure creates no authenticated state. |
| References | FR-02, FR-04, FR-40, FR-42; US-02, US-04 |

### UC-03 - Sign Out

| Field | Description |
| --- | --- |
| Actor | Authenticated user |
| Preconditions | The user is authenticated. |
| Main flow | User selects Sign Out; system invalidates the authenticated state; protected resources require authentication again. |
| Failure | The system does not claim sign-out succeeded while the authenticated state remains active. |
| References | FR-03, FR-04; US-03 |

### UC-20 - Verify Email Address

| Field | Description |
| --- | --- |
| Actor | Unauthenticated visitor or authenticated user |
| Preconditions | A verification message has been requested for the account. |
| Main flow | User opens the verification link; system validates the single-use token; system marks the email as verified; private note access becomes available. |
| Alternatives | User requests a replacement message subject to rate limits. |
| Failure | Missing, expired, or reused tokens do not verify the email or grant note access. |
| References | FR-46, FR-51; US-41 |

### UC-21 - Sign In with External Provider

| Field | Description |
| --- | --- |
| Actor | Unauthenticated visitor |
| Preconditions | The selected provider is configured and available. |
| Main flow | User starts Google or Facebook sign-in; provider authenticates the user; the server validates the callback; the provider identity is resolved to an account; the existing session service creates an authenticated session. |
| Alternatives | A new account is created only when the provider identity is not linked to another account and the provider supplies a verified email. |
| Failure | Invalid state, callback, provider response, or unverified email creates no authenticated session. |
| References | FR-47, FR-48, FR-50; US-42, US-43 |

### UC-22 - Link External Provider

| Field | Description |
| --- | --- |
| Actor | Authenticated user |
| Preconditions | The user has a verified email and an active session. |
| Main flow | User starts linking Google or Facebook; the server validates the callback and stores the provider subject for the current user. |
| Alternatives | An already-linked provider is left unchanged. |
| Failure | A provider identity linked to another account is rejected without changing either account. |
| References | FR-49, FR-50; US-44 |

### UC-23 - Reset Password

| Field | Description |
| --- | --- |
| Actor | Unauthenticated visitor |
| Preconditions | The password reset flow is available. |
| Main flow | User submits an email address; system returns a generic response; if appropriate, the system sends a reset message; user opens the link and submits a valid new password; system updates the password and revokes existing sessions. |
| Alternatives | The user requests another reset message subject to rate limits. |
| Failure | Invalid, expired, reused, or excessive reset attempts do not change the password or create a session. |
| References | FR-52-FR-55; US-45, US-46 |

## Notes and Autosave

### UC-04 - Create Note

| Field | Description |
| --- | --- |
| Actor | Authenticated user |
| Preconditions | The user is authenticated. |
| Main flow | User selects Create Note; system creates a blank or populated note owned by the user; editor opens; metadata is recorded. |
| Failure | The note is not reported as created if persistence fails. |
| References | FR-06, FR-17, FR-18; US-05 |

### UC-05 - View Note

| Field | Description |
| --- | --- |
| Actor | Authenticated user |
| Preconditions | The requested note exists and is accessible to the user. |
| Main flow | User selects a note; system verifies ownership; system displays content and metadata. |
| Failure | Missing or unauthorized notes are not displayed. |
| References | FR-07, FR-43, FR-44; US-06, US-04 |

### UC-06 - Edit Note

| Field | Description |
| --- | --- |
| Actor | Authenticated user |
| Preconditions | The user owns an editable note. |
| Main flow | User changes title or content; system accepts supported rich text; the change becomes eligible for autosave; successful persistence updates modification time. |
| Failure | Unauthorized or invalid changes are rejected and not persisted. |
| References | FR-08, FR-19, FR-43; US-07, US-08 |

### UC-07 - Autosave Note

| Field | Description |
| --- | --- |
| Actor | Application on behalf of the authenticated user |
| Preconditions | The note has unsaved changes. |
| Main flow | Save condition is reached; system validates and authorizes the change; latest valid content is persisted; status becomes Saved. |
| Alternatives | Rapid edits are grouped; newer content remains authoritative when saves overlap. |
| Failure | Network, server, or authorization failure produces Save Failed and retains the editor state during the session. |
| References | FR-32-FR-36, NFR-17, NFR-18, NFR-20, NFR-35; US-09-US-11 |

## Search and Organization

### UC-08 - Search Notes

| Field | Description |
| --- | --- |
| Actor | Authenticated user |
| Preconditions | The user is authenticated. |
| Main flow | User submits a query; system searches owned Active and Archived notes by title, content, and tags; matching results are displayed. |
| Alternatives | Empty query follows the defined UI behavior; no matches display an empty-result state; Trashed notes are excluded. |
| Failure | Search failure is reported without displaying unrelated notes. |
| References | FR-28-FR-31, FR-43; US-20-US-22 |

### UC-09 - Create Notebook

| Field | Description |
| --- | --- |
| Actor | Authenticated user |
| Main flow | User submits a valid notebook name; system creates and displays a notebook owned by the user. |
| Alternatives | Invalid names are rejected. |
| References | FR-20, FR-40, FR-42; US-12 |

### UC-10 - Move Note

| Field | Description |
| --- | --- |
| Actor | Authenticated user |
| Main flow | User selects a note and an owned notebook, or no notebook; system updates the association without changing content. |
| Failure | An inaccessible or missing target causes no change. |
| References | FR-23, FR-43, FR-44; US-15 |

### UC-11 - Manage Notebook

| Field | Description |
| --- | --- |
| Actor | Authenticated user |
| Main flow | User views, renames, or deletes an owned notebook; deletion unassigns its notes without deleting them. |
| Failure | Unauthorized or missing notebooks remain unchanged. |
| References | FR-20-FR-22, FR-43, FR-44; US-12-US-14 |

### UC-12 - Manage Tags

| Field | Description |
| --- | --- |
| Actor | Authenticated user |
| Main flow | User creates a tag, assigns it to an owned note, removes an association, or browses notes by tag. |
| Failure | Invalid, missing, or unauthorized tags and notes are rejected. |
| References | FR-24-FR-27, FR-40, FR-43, FR-44; US-16-US-19 |

### UC-13 - Manage Favorites

| Field | Description |
| --- | --- |
| Actor | Authenticated user |
| Main flow | User marks or unmarks an owned note as favorite and opens the Favorites view to see owned favorites. |
| Failure | Unauthorized or missing notes are not changed or displayed. |
| References | FR-16, FR-45, FR-43, FR-44; US-23, US-24, US-40 |

### UC-14 - Archive Note

| Field | Description |
| --- | --- |
| Actor | Authenticated user |
| Main flow | User archives an Active note or unarchives an Archived note; the state and corresponding view update. |
| Failure | Unauthorized or missing notes remain unchanged. |
| References | FR-13-FR-15, FR-43, FR-44; US-25, US-26 |

## Trash and Recovery

### UC-15 - Move Note to Trash and View Trash

| Field | Description |
| --- | --- |
| Actor | Authenticated user |
| Main flow | User deletes an owned Active or Archived note; system changes it to Trashed; user opens Trash and sees only their Trashed notes. |
| Alternative | User cancels a confirmation; the note remains unchanged. |
| Failure | Unauthorized or missing notes are not changed. |
| References | FR-09, FR-10, FR-13, FR-43, FR-44; US-27, US-28 |

### UC-16 - Restore Note

| Field | Description |
| --- | --- |
| Actor | Authenticated user |
| Preconditions | The note is in Trash and belongs to the user. |
| Main flow | User selects Restore; system returns the note to its previous state and notebook when available, otherwise Active with no notebook. |
| Failure | The note remains in Trash when restoration fails. |
| References | FR-11, FR-13, FR-43, FR-44; US-29 |

### UC-17 - Permanently Delete Note

| Field | Description |
| --- | --- |
| Actor | Authenticated user |
| Preconditions | The note is in Trash and belongs to the user. |
| Main flow | User selects Permanent Delete and confirms; system removes the note from normal application operations. |
| Alternative | Cancellation leaves the note in Trash. |
| Failure | A failed deletion leaves the note in Trash and is not reported as successful. |
| References | FR-12, FR-43, FR-44, NFR-21; US-30 |

## Dashboard and Navigation

### UC-19 - Use Dashboard and Navigate

| Field | Description |
| --- | --- |
| Actor | Authenticated user |
| Main flow | User opens the dashboard; system displays links to Notes, Notebooks, Tags, Favorites, Archive, Trash, and Search; user selects an area. |
| Alternative | Empty collections display a clear empty state. |
| Failure | Unauthenticated access is denied or redirected to authentication. |
| References | FR-37-FR-39, FR-04; US-31-US-33 |

## Note State Rules

```text
Active <-> Archived
  |          |
  +-----> Trashed -----> Removed
              |
              +-----> Previous state and notebook, when possible
```

Only the user can permanently move an owned Trashed note to Removed. Trashed notes are excluded from normal search.
