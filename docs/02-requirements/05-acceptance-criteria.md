# Acceptance Criteria

Acceptance criteria define observable conditions for deciding whether MVP behavior is complete. They use Given, When, and Then statements.

## Authentication

### AC-01 - Registration

- **Given** a visitor submits a unique valid email and password, **when** registration is submitted, **then** one account is created.
- **Given** registration data is missing, invalid, or already used, **when** it is submitted, **then** no account is created and a validation error is shown.
- **Given** account persistence fails, **when** registration is submitted, **then** the system does not report success.

### AC-02 - Sign In

- **Given** valid credentials, **when** the user signs in, **then** an authenticated state is created and the dashboard is accessible.
- **Given** invalid or incomplete credentials, **when** the user signs in, **then** authentication is denied and protected resources remain inaccessible.

### AC-03 - Sign Out

- **Given** an authenticated user selects Sign Out, **when** the operation succeeds, **then** protected resources require authentication again.

## Notes and Editing

### AC-04 - Create Note

- **Given** an authenticated user selects Create Note, **when** creation succeeds, **then** a blank note owned by that user opens in the editor.
- **Given** a note is created, **then** its creation and modification timestamps and ownership are recorded.
- **Given** creation fails, **then** no successful creation message is shown.

### AC-05 - View Note

- **Given** a user owns a note, **when** they open it, **then** its content and metadata are displayed.
- **Given** a note belongs to another user or does not exist, **when** it is requested, **then** its content is not disclosed and the operation is rejected.

### AC-06 - Edit Note and Rich Text

- **Given** a user owns a note, **when** they change its title or content, **then** the valid change becomes eligible for autosave.
- **Given** the editor supports headings, bold, italic, lists, links, and code formatting, **when** the user applies one, **then** the formatting is preserved after saving and reopening.
- **Given** an unauthorized user attempts an edit, **then** the change is rejected and not persisted.
- **Given** a change is successfully persisted, **then** the modification timestamp changes.

## Autosave

### AC-07 - Autosave

- **Given** a note has unsaved changes, **when** the configured save condition is reached, **then** the latest valid content is submitted.
- **Given** a save is in progress, **then** the interface shows Saving and later shows Saved or Save Failed.
- **Given** a save fails, **then** the interface does not show Saved and the current editor state remains available during the session.
- **Given** overlapping saves complete out of order, **then** an older save cannot overwrite newer content.
- **Given** a user types continuously, **then** the system does not send one persistence request for every keystroke.

## Notebooks

### AC-08 - Create and View Notebook

- **Given** an authenticated user submits a valid notebook name, **then** a notebook owned by that user is created and displayed.
- **Given** the name is invalid, **then** the notebook is not created and a validation error is displayed.

### AC-09 - Rename Notebook

- **Given** the user owns a notebook, **when** a valid new name is submitted, **then** only the notebook name changes.
- **Given** the user does not own the notebook, **then** the rename is rejected.

### AC-10 - Delete Notebook

- **Given** the user owns a notebook, **when** deletion is confirmed, **then** the notebook is deleted and its notes remain without a notebook.
- **Given** deletion is cancelled, **then** the notebook and its note assignments remain unchanged.

### AC-11 - Move Note

- **Given** the user owns a note and target notebook, **when** the note is moved, **then** its notebook assignment changes and its content remains unchanged.
- **Given** the target is missing or unauthorized, **then** the note remains unchanged.

## Tags

### AC-12 - Create Tag

- **Given** an authenticated user submits a valid tag name, **then** an owned tag is created and available for assignment.
- **Given** the tag name is invalid, **then** the tag is not created.
- **Given** the user already has a tag with the same normalized name, **then** a duplicate tag is not created.

### AC-13 - Assign Tag

- **Given** the user owns the note and tag, **when** the tag is assigned, **then** the association is stored.

### AC-14 - Remove Tag

- **Given** a tag is assigned to a note, **when** the user removes it, **then** only the association is removed.

### AC-15 - Browse by Tag

- **Given** a user selects one of their tags, **then** only their notes associated with that tag are displayed.

## Search

### AC-16 - Search Notes

- **Given** a user submits a query, **then** the system searches their Active and Archived notes by title, content, and tags.
- **Given** a matching owned note exists, **then** it appears in the results.
- **Given** another user's note matches, **then** it does not appear.
- **Given** a Trashed note matches, **then** it does not appear in normal search results.

### AC-17 - Empty Search Results

- **Given** no Active or Archived note matches, **when** search completes, **then** an empty-result state is displayed and unrelated notes are not shown.

## Favorites and Archive

### AC-18 - Favorite Note

- **Given** the user owns a note, **when** Favorite is selected, **then** the note is marked as a favorite.

### AC-19 - Unfavorite Note

- **Given** a note is a favorite, **when** Unfavorite is selected, **then** the favorite state is removed without changing content.

### AC-20 - Archive Note

- **Given** the user owns an Active note, **when** Archive is selected, **then** the note becomes Archived and leaves the Active collection.

### AC-21 - Unarchive Note

- **Given** a note is Archived, **when** Unarchive is selected, **then** the note becomes Active.

### AC-44 - View Favorites

- **Given** the user has favorite notes, **when** Favorites is opened, **then** only that user's favorite notes are displayed.

## Trash and Recovery

### AC-22 - Move Note to Trash

- **Given** the user owns an Active or Archived note, **when** deletion is confirmed, **then** the note becomes Trashed and leaves normal collections and search results.
- **Given** deletion is cancelled, **then** the note remains unchanged.

### AC-23 - View Trash

- **Given** the user has Trashed notes, **when** Trash is opened, **then** only that user's Trashed notes are displayed.

### AC-24 - Restore Note

- **Given** a note is Trashed, **when** Restore is selected, **then** the note returns to its previous state and notebook when available.
- **Given** its previous notebook no longer exists, **then** the note returns to Active with no notebook.

### AC-25 - Permanent Delete

- **Given** a note is Trashed, **when** the user confirms Permanent Delete, **then** the note is removed from normal application operations.
- **Given** the user cancels or deletion fails, **then** the note remains in Trash and success is not reported.

## Dashboard and Errors

### AC-26 - Dashboard

- **Given** the user is authenticated, **when** the dashboard opens, **then** it provides access to Notes, Notebooks, Tags, Favorites, Archive, Trash, and Search.

### AC-27 - Note List

- **Given** the user opens a note collection, **then** only notes the user is authorized to view are listed.

### AC-28 - Navigation

- **Given** the user selects an MVP area, **then** the selected area opens without losing authentication.

### AC-31 - Validation Errors

- **Given** input violates a validation rule, **when** the operation is submitted, **then** it is rejected and the user receives a message identifying what must be corrected.

### AC-32 - Operation Errors

- **Given** an operation fails, **then** the system does not report success, preserves data consistency, and displays a retryable error when retry is safe.

### AC-33 - Unauthorized Operations

- **Given** a user attempts to access or change another user's resource, **then** the server rejects the operation without exposing or modifying that resource.

### AC-34 - Missing Resources

- **Given** a requested resource does not exist or is unavailable to the user, **then** the system performs no change and returns a not-found result without revealing ownership information.

## Cross-Cutting Security and Quality

### AC-35 - User Data Isolation

- **Given** User A and User B have separate accounts, **when** User A lists, searches, views, edits, moves, archives, favorites, trashes, restores, or deletes data, **then** only User A's authorized data is available.

### AC-45 - Security Baseline

- **Given** production configuration is used, **then** passwords, tokens, secrets, private note content, and internal error details are not exposed in logs or client responses.
- **Given** rich-text content contains unsafe markup, **then** it is sanitized or safely rendered without script execution.

### AC-46 - Performance

- **Given** the defined MVP test load and dataset, **then** normal API operations, note loading, and search meet the p95 targets in NFR-02, NFR-03, and NFR-04.

### AC-47 - Accessibility and Responsive Use

- **Given** a supported browser and screen size, **then** core note operations work on desktop and mobile layouts, by keyboard where applicable, with labels and feedback that do not depend on color alone.

### AC-48 - Backup and Recovery

- **Given** a production backup exists, **when** the documented recovery procedure is executed in a test environment, **then** application data can be restored and the result is recorded.

## Traceability Matrix

| Requirements | Stories | Use cases | Acceptance |
| --- | --- | --- | --- |
| FR-01-FR-05 | US-01-US-04 | UC-01-UC-03 | AC-01-AC-03, AC-33, AC-35 |
| FR-06-FR-08, FR-17-FR-19 | US-05-US-08 | UC-04-UC-06 | AC-04-AC-06 |
| FR-09-FR-11, FR-13 | US-27-US-29 | UC-15, UC-16 | AC-22-AC-24 |
| FR-12 | US-30 | UC-17 | AC-25 |
| FR-16, FR-45 | US-23, US-24, US-40 | UC-13 | AC-18, AC-19, AC-44 |
| FR-14-FR-15 | US-25, US-26 | UC-14 | AC-20, AC-21 |
| FR-20-FR-23 | US-12-US-15 | UC-09-UC-11 | AC-08-AC-11 |
| FR-24-FR-27 | US-16-US-19 | UC-12 | AC-12-AC-15 |
| FR-28-FR-31 | US-20-US-22 | UC-08 | AC-16, AC-17 |
| FR-32-FR-36 | US-09-US-11 | UC-07 | AC-07 |
| FR-37-FR-39 | US-31-US-33 | UC-19 | AC-26-AC-28 |
| FR-40-FR-44 | US-36-US-39 | Cross-cutting | AC-31-AC-34 |
| NFR-08-NFR-16, NFR-34 | US-04, US-38 | Cross-cutting | AC-33, AC-35, AC-45 |
| NFR-17-NFR-21, NFR-35 | US-09-US-11, US-27-US-30 | UC-07, UC-15-UC-17 | AC-07, AC-22-AC-25 |
| NFR-02-NFR-04 | US-20 | UC-08 | AC-46 |
| NFR-40-NFR-46 | US-31-US-33 | UC-19 | AC-47 |
| NFR-49-NFR-52 | US-04 | Cross-cutting | AC-45, AC-48 |

## Requirements Handoff

The Design phase may now define architecture, database, API, authentication, authorization, search, and autosave implementation without changing the approved MVP behavior.
