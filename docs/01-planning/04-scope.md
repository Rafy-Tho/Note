# Project Scope

## Scope Overview

The MVP is a responsive web application for managing private personal notes. It prioritizes secure note creation, reliable editing, organization, search, and recovery.

## In Scope: MVP

### Authentication and Security

- Account registration
- Sign-in and sign-out
- Mandatory email verification
- Password reset through verified email
- Google and Facebook sign-in
- Authenticated provider linking
- Protected private resources
- Server-side ownership authorization

### Notes

- Create, view, edit, and delete notes
- Note title, content, creation time, and modification time
- Limited rich-text editing
- Automatic saving with save-status feedback

### Organization

- Create, rename, and delete notebooks according to defined rules
- Move notes between notebooks
- Create and apply tags
- Remove tags from notes
- Mark notes as favorites
- Archive and unarchive notes

### Search and Recovery

- Search titles, content, and tags
- Show only authorized results
- Move notes to Trash
- View, restore, and permanently delete trashed notes

### User Interface

- Authentication screens
- Dashboard and navigation
- Notes list and editor
- Search, notebook, tag, favorite, archive, and Trash views
- Loading, error, and empty states
- Responsive behavior for desktop, tablet, and mobile browsers

## Out of Scope: MVP

- Profile management and general settings
- Public note URLs or note sharing
- Shared notebooks and collaboration
- Real-time synchronization
- AI generation, summarization, or writing assistance
- Native Android or iOS applications
- Full offline-first editing and conflict resolution
- Advanced permission models
- Telegram sign-in or sign-up
- Attachments and advanced media support
- Version history and knowledge graphs
- Productivity analytics

## MVP Priority Model

| Priority | Meaning | Examples |
| --- | --- | --- |
| P0 | Required for the MVP workflow | Authentication, notes, autosave, security, search, Trash and restore |
| P1 | Important MVP functionality | Notebooks, tags, favorites, archive, responsive UX |
| P2 | Post-MVP improvements | Profile, settings, templates, shortcuts, attachments |
| P3 | Future product direction | Collaboration, sharing, AI, offline support |

## MVP Boundary

The MVP is complete when the following workflow works reliably and securely:

```text
Register, verify email, reset a password, or sign in with Google/Facebook
        ↓
Create and edit rich-text note
        ↓
Autosave changes
        ↓
Organize and search
        ↓
Favorite or archive
        ↓
Trash and restore
```

## Decisions Required Before Implementation

The Requirements phase must define:

- Required and optional note fields
- Supported rich-text formatting
- Autosave timing, retry, and conflict behavior
- Trash retention and permanent deletion rules
- Note behavior when a notebook is deleted
- Search behavior for active, archived, and trashed notes
- Tag naming and uniqueness rules

## Scope Change Policy

Any feature proposed after MVP approval is a scope change. Review it for user value, security impact, complexity, development effort, testing effort, and schedule impact before implementation.

Features that do not support the core MVP should move to a future phase.
