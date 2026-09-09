# Project Goals

## Goal Summary

| Priority | Goal | Expected outcome |
| --- | --- | --- |
| P0 | Secure private data | Users cannot access or modify another user's resources. |
| P0 | Reliable note workflow | Users can create, edit, and view notes successfully. |
| P0 | Reduce data loss | Autosave, trash, and restore protect user work. |
| P0 | Make notes easy to find | Users can search titles, content, and tags. |
| P1 | Improve organization | Users can use notebooks, tags, favorites, and archive. |
| P1 | Provide a reliable experience | Errors, loading states, save states, and empty states are clear. |
| P1 | Build a maintainable foundation | The system is testable, understandable, and appropriately separated. |

## Goal Details

### Secure Private Data

- Require authentication for private resources.
- Enforce ownership checks on the server.
- Validate user input and handle rich text safely.
- Prevent sensitive information from appearing in errors or logs.

### Reliable Note Workflow

- Allow authenticated users to create, view, and edit notes.
- Provide a focused rich-text editor with a defined MVP feature set.
- Record creation and modification metadata.

### Reduce Data Loss

- Automatically save changes without saving every keystroke.
- Show whether changes are saving, saved, or failed.
- Move normally deleted notes to Trash.
- Allow users to restore notes before permanent deletion.

### Find Information

- Search note titles, content, and tags.
- Return only notes the current user can access.
- Provide clear results and empty-result states.

### Organize Notes

- Support notebooks and tags.
- Support favorites and archive views.
- Allow notes to move between valid organizational locations.

## MVP Success Definition

The MVP is successful when an authenticated user can securely complete this workflow:

```text
Sign in
  ↓
Create and edit a note
  ↓
Confirm that changes are saved
  ↓
Organize and search the note
  ↓
Favorite, archive, trash, and restore the note
```

The workflow must be covered by acceptance criteria and relevant automated tests.

## Future Goals

After the MVP is stable, future work may include:

- Profile and settings management
- Templates, shortcuts, attachments, and version history
- Sharing and real-time collaboration
- AI-assisted note features
- Offline support

Future goals must not expand the MVP without a scope review.
