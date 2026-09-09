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
