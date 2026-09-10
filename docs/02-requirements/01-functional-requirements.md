# Functional Requirements

Functional requirements define what the MVP must do. Mandatory behavior uses **shall**.

## Requirement Rules

- Every requirement has a stable `FR-XX` identifier.
- Requirements must be observable and testable.
- Technical implementation belongs in the Design documents.
- User profile management and general settings are outside the MVP.

## MVP Business Rules

- Password authentication requires a verified email address before private notes are accessible.
- Google and Facebook sign-in are supported through server-validated provider callbacks.
- Existing users may link Google or Facebook only from an authenticated session.
- Users may request a password reset through their verified email address.
- Blank notes are allowed.
- A note may have an empty title and empty content when first created.
- MVP rich text supports headings, bold, italic, lists, links, and code formatting.
- Notes can be Active, Archived, or Trashed.
- Restoring a note returns it to its previous state and notebook when those still exist; otherwise it returns to Active with no notebook.
- Deleting a notebook unassigns its notes and does not delete them.
- Normal search includes Active and Archived notes and excludes Trashed notes.
- Trashed notes remain until the user permanently deletes them.
- Permanent deletion is available only for notes in Trash.
- Tag names are unique per user after the system applies its defined normalization rules.

## Authentication and Authorization

| ID | Priority | Requirement |
| --- | --- | --- |
| FR-01 | P0 | The system shall allow a visitor to create an account using a unique email address and password. |
| FR-02 | P0 | The system shall allow a registered user to sign in with valid credentials. |
| FR-03 | P0 | The system shall allow an authenticated user to sign out and invalidate the authenticated state. |
| FR-04 | P0 | The system shall require authentication before granting access to private application resources. |
| FR-05 | P0 | The server shall verify resource ownership for every protected read or write operation. |
| FR-46 | P0 | The system shall require a user to verify their email address before granting access to private notes. |
| FR-47 | P0 | The system shall allow a visitor to sign in with a validated Google account. |
| FR-48 | P0 | The system shall allow a visitor to sign in with a validated Facebook account. |
| FR-49 | P0 | The system shall allow an authenticated user to link a Google or Facebook identity to their existing account. |
| FR-50 | P0 | The system shall prevent automatic account merging based only on a matching email address. |
| FR-51 | P0 | The system shall allow a user to request another email-verification message subject to rate limits. |
| FR-52 | P0 | The system shall allow a user to request a password reset without revealing whether an email address is registered. |
| FR-53 | P0 | The system shall allow a user to set a new password using a valid, unexpired, single-use reset token. |
| FR-54 | P0 | The system shall invalidate all existing authenticated sessions after a successful password reset. |
| FR-55 | P0 | The system shall rate limit password-reset requests and reset-token attempts. |

## Notes and Note States

| ID | Priority | Requirement |
| --- | --- | --- |
| FR-06 | P0 | The system shall allow an authenticated user to create a blank or populated note owned by that user. |
| FR-07 | P0 | The system shall allow an authenticated user to view their own notes and note metadata. |
| FR-08 | P0 | The system shall allow an authenticated user to edit their own note using the supported rich-text features. |
| FR-09 | P0 | Normal deletion shall move a note to Trash and remove it from normal note collections and search results. |
| FR-10 | P0 | The system shall allow an authenticated user to view their own Trashed notes. |
| FR-11 | P0 | The system shall allow an authenticated user to restore a Trashed note according to the restoration rules above. |
| FR-12 | P1 | The system shall allow an authenticated user to permanently delete a note from Trash after intentional confirmation. |
| FR-13 | P0 | The system shall maintain the note states Active, Archived, and Trashed. |
| FR-14 | P1 | The system shall allow an authenticated user to archive an Active note and view archived notes separately. |
| FR-15 | P1 | The system shall allow an authenticated user to return an Archived note to Active. |
| FR-16 | P1 | The system shall allow an authenticated user to mark and unmark an owned note as a favorite. |

## Note Metadata

| ID | Priority | Requirement |
| --- | --- | --- |
| FR-17 | P0 | Each note shall have a title, content, creation timestamp, modification timestamp, and owning user. |
| FR-18 | P0 | The system shall set the creation timestamp when a note is created and shall not change it afterward. |
| FR-19 | P0 | The system shall update the modification timestamp only after a change is successfully persisted. |

## Notebooks

| ID | Priority | Requirement |
| --- | --- | --- |
| FR-20 | P1 | The system shall allow an authenticated user to create and view their own notebooks. |
| FR-21 | P1 | The system shall allow an authenticated user to rename their own notebook. |
| FR-22 | P1 | The system shall allow an authenticated user to delete their own notebook and unassign its notes without deleting them. |
| FR-23 | P1 | The system shall allow an authenticated user to move an owned note to another owned notebook or to no notebook. |

## Tags

| ID | Priority | Requirement |
| --- | --- | --- |
| FR-24 | P1 | The system shall allow an authenticated user to create and view their own tags; tag names shall be unique for that user. |
| FR-25 | P1 | The system shall allow an authenticated user to assign one or more owned tags to an owned note. |
| FR-26 | P1 | The system shall allow an authenticated user to remove a tag association without deleting the note or tag. |
| FR-27 | P1 | The system shall allow an authenticated user to view notes associated with one of their tags. |

## Search

| ID | Priority | Requirement |
| --- | --- | --- |
| FR-28 | P0 | The system shall allow an authenticated user to search their Active and Archived notes by title, content, and tag. |
| FR-29 | P0 | Search results shall contain only notes owned by the authenticated user. |
| FR-30 | P0 | The system shall display a defined empty-result state when no notes match a query. |
| FR-31 | P0 | The system shall not include Trashed notes in normal search results. |

## Autosave

| ID | Priority | Requirement |
| --- | --- | --- |
| FR-32 | P0 | The system shall automatically persist note changes after the configured autosave condition is reached. |
| FR-33 | P0 | Autosave shall not send one persistence request for every keystroke. |
| FR-34 | P0 | The interface shall show Unsaved Changes, Saving, Saved, or Save Failed as applicable. |
| FR-35 | P0 | A failed autosave shall not be shown as successful, and the current editor state shall remain available during the session. |
| FR-36 | P0 | An older autosave result shall not overwrite newer note content. |

## Dashboard and Navigation

| ID | Priority | Requirement |
| --- | --- | --- |
| FR-37 | P0 | The system shall provide an authenticated dashboard with access to Notes, Notebooks, Tags, Favorites, Archive, Trash, and Search. |
| FR-38 | P0 | The system shall provide a collection view from which the user can identify and open notes. |
| FR-39 | P0 | The system shall allow navigation between MVP areas without losing the authenticated state. |

## Collection Views

| ID | Priority | Requirement |
| --- | --- | --- |
| FR-45 | P1 | The system shall allow an authenticated user to view their favorite notes. |

## Validation and Errors

| ID | Priority | Requirement |
| --- | --- | --- |
| FR-40 | P0 | The system shall validate required and constrained input before processing it. |
| FR-41 | P0 | The system shall return a clear validation error when input is rejected. |
| FR-42 | P0 | The system shall report operation failures without claiming success. |
| FR-43 | P0 | The system shall reject unauthorized operations without exposing protected resource data. |
| FR-44 | P0 | The system shall return a not-found result when a requested resource does not exist or is unavailable to the user. |

## Out of Scope for MVP

- Profile viewing or editing
- General settings
- Telegram sign-in or sign-up
- Account deletion and data export
- Sharing and collaboration
- AI features
- Native mobile applications
- Full offline synchronization

## Requirements Handoff

The Requirements phase defines behavior. The Design phase will define the database, API, authentication implementation, authorization implementation, search implementation, and autosave implementation.
