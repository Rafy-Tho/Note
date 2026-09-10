# User Stories

User stories describe user outcomes. Each story maps to one or more functional requirements.

## User Types

| User type | Access |
| --- | --- |
| Unauthenticated visitor | Registration and sign-in only. |
| Authenticated user | Their own notes and MVP organization features. |

## Authentication and Privacy

| ID | Priority | User story | Requirements |
| --- | --- | --- | --- |
| US-01 | P0 | As a visitor, I want to create an account so that I can use private notes. | FR-01 |
| US-02 | P0 | As a registered user, I want to sign in so that I can access my notes. | FR-02, FR-04 |
| US-03 | P0 | As an authenticated user, I want to sign out so that my session is no longer usable. | FR-03 |
| US-04 | P0 | As a user, I want my notes and organization data to remain private. | FR-04, FR-05 |
| US-41 | P0 | As a new user, I want to verify my email so that my private notes are protected. | FR-46, FR-51 |
| US-42 | P0 | As a visitor, I want to sign in with Google so that I can access my notes without creating another password. | FR-47 |
| US-43 | P0 | As a visitor, I want to sign in with Facebook so that I can access my notes without creating another password. | FR-48 |
| US-44 | P0 | As an authenticated user, I want to link a supported provider so that I can use it for future sign-ins. | FR-49, FR-50 |
| US-45 | P0 | As a user who forgot my password, I want to request a reset email without exposing whether my account exists. | FR-52, FR-55 |
| US-46 | P0 | As a user with a valid reset link, I want to choose a new password and invalidate old sessions. | FR-53, FR-54 |

## Notes and Editing

| ID | Priority | User story | Requirements |
| --- | --- | --- | --- |
| US-05 | P0 | As a user, I want to create a blank or populated note so that I can record information immediately. | FR-06, FR-17, FR-18 |
| US-06 | P0 | As a user, I want to open my notes so that I can read their content and metadata. | FR-07 |
| US-07 | P0 | As a user, I want to edit my notes so that I can update information over time. | FR-08, FR-19 |
| US-08 | P0 | As a user, I want basic rich-text formatting so that my notes are easier to read. | FR-08 |

## Autosave

| ID | Priority | User story | Requirements |
| --- | --- | --- | --- |
| US-09 | P0 | As a user, I want changes saved automatically so that I do not lose recent work. | FR-32, FR-33, NFR-17 |
| US-10 | P0 | As a user, I want to see save status so that I know whether my changes are persisted. | FR-34 |
| US-11 | P0 | As a user, I want failed saves to be visible while my current editor state is retained. | FR-35, FR-36, NFR-18, NFR-20 |

## Notebooks

| ID | Priority | User story | Requirements |
| --- | --- | --- | --- |
| US-12 | P1 | As a user, I want to create and view notebooks so that I can group related notes. | FR-20 |
| US-13 | P1 | As a user, I want to rename my notebooks so that their names remain useful. | FR-21 |
| US-14 | P1 | As a user, I want to delete a notebook without deleting its notes. | FR-22 |
| US-15 | P1 | As a user, I want to move notes between notebooks or remove their notebook assignment. | FR-23 |

## Tags

| ID | Priority | User story | Requirements |
| --- | --- | --- | --- |
| US-16 | P1 | As a user, I want to create and view tags so that I can categorize notes. | FR-24 |
| US-17 | P1 | As a user, I want to assign multiple tags to a note so that I can categorize it in different ways. | FR-25 |
| US-18 | P1 | As a user, I want to remove a tag from a note without deleting the note. | FR-26 |
| US-19 | P1 | As a user, I want to browse notes by tag so that I can find related notes quickly. | FR-27 |

## Search

| ID | Priority | User story | Requirements |
| --- | --- | --- | --- |
| US-20 | P0 | As a user, I want to search my notes so that I can find information quickly. | FR-28, FR-29 |
| US-21 | P0 | As a user, I want search to include titles, content, and tags. | FR-28 |
| US-22 | P0 | As a user, I want a clear empty result when no note matches my query. | FR-30, FR-31 |

## Favorites and Archive

| ID | Priority | User story | Requirements |
| --- | --- | --- | --- |
| US-23 | P1 | As a user, I want to favorite a note so that I can reach it quickly. | FR-16 |
| US-24 | P1 | As a user, I want to remove a favorite so that the list remains useful. | FR-16 |
| US-25 | P1 | As a user, I want to archive a note so that my active collection stays focused. | FR-14 |
| US-26 | P1 | As a user, I want to unarchive a note so that I can use it again. | FR-15 |
| US-40 | P1 | As a user, I want to view my favorite notes in one place. | FR-45 |

## Trash and Recovery

| ID | Priority | User story | Requirements |
| --- | --- | --- | --- |
| US-27 | P0 | As a user, I want normal deletion to move a note to Trash so that accidental deletion is recoverable. | FR-09, FR-13 |
| US-28 | P0 | As a user, I want to view my Trashed notes so that I can restore or remove them. | FR-10 |
| US-29 | P0 | As a user, I want to restore a Trashed note to its previous organization when possible. | FR-11 |
| US-30 | P1 | As a user, I want to permanently delete a Trashed note after confirmation. | FR-12 |

## Dashboard and Errors

| ID | Priority | User story | Requirements |
| --- | --- | --- | --- |
| US-31 | P0 | As an authenticated user, I want a dashboard that exposes the main note areas. | FR-37 |
| US-32 | P0 | As a user, I want to see my notes in a collection so that I can select one to edit. | FR-38 |
| US-33 | P0 | As a user, I want consistent navigation between MVP areas. | FR-39 |
| US-36 | P0 | As a user, I want validation errors to explain what I need to correct. | FR-40, FR-41 |
| US-37 | P0 | As a user, I want failed operations to be reported without false success. | FR-42 |
| US-38 | P0 | As a user, I want unauthorized actions rejected so that private data is protected. | FR-43 |
| US-39 | P0 | As a user, I want missing resources handled clearly instead of causing an unexplained failure. | FR-44 |

## Out of Scope

The MVP has no stories for profile management, general settings, Telegram sign-in or sign-up, account deletion, data export, sharing, collaboration, AI, native mobile applications, or full offline synchronization.
