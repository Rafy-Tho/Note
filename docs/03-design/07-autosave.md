# Autosave Design

## Purpose

This document defines how note edits are detected, persisted, reported, and protected from stale saves.

## Save States

The editor uses these states:

```text
Saved
  -> Unsaved Changes
  -> Saving
  -> Saved
        or
      Save Failed
```

The interface must never show Saved until the server confirms persistence.

## Save Trigger

- Keep the latest editor content in local component state.
- Mark the editor dirty when title or content changes.
- Start autosave after 800 ms of inactivity.
- Trigger a save when the editor loses focus if changes are pending.
- Do not send a request when content is unchanged.
- Do not attempt full offline synchronization in the MVP.

## Save Flow

```text
Editor change
  -> Mark Unsaved Changes
  -> Wait for debounce
  -> Show Saving
  -> PATCH /notes/:noteId
  -> Validate and authorize
  -> Compare revision
  -> Persist atomically
  -> Show Saved or Save Failed
```

## Request Payload

The update request uses the API contract:

```json
{
  "title": "Note title",
  "contentJson": {},
  "revision": 3
}
```

The server returns the new revision and modification timestamp after success.

## Revision and Stale-Save Protection

- Each note has an integer `revision`.
- The client sends the revision it last received.
- The server updates the note only when the revision matches.
- A successful update increments the revision atomically.
- A stale revision returns `409 CONFLICT`.
- A stale response must never replace newer local editor content.

Only one save request should be active for a note at a time. If the user continues typing while a save is active, the client queues the latest state and saves it after the current request finishes.

## Failure Handling

| Failure | Behavior |
| --- | --- |
| Validation error | Show Save Failed and identify the field to correct. |
| Authentication expiry | Preserve editor state and require sign-in. |
| Authorization failure | Do not persist the change; show Save Failed. |
| Network failure | Preserve editor state and allow retry. |
| Server failure | Preserve editor state and show Save Failed. |
| Revision conflict | Keep local content, do not overwrite it silently, and require an explicit recovery action. |

The current editor state remains available during the session. The MVP does not promise persistence after the browser is closed during a failed save.

## Retry Behavior

- Retry temporary failures with limited backoff.
- Do not retry validation, authorization, or revision conflicts automatically.
- A manual retry sends the latest local state and current known revision.
- Repeated failures remain visible to the user.

## Server Transaction

The server performs these steps in one transaction:

1. Authenticate the session.
2. Load the note using `note_id` and `user_id`.
3. Validate title and rich-text content.
4. Compare `revision`.
5. Update content, searchable text, `updated_at`, and revision.
6. Commit the transaction.

If any step fails, the note remains unchanged.

## Navigation and Page Exit

- The client should attempt to flush pending changes on editor blur and controlled navigation.
- The UI must show Save Failed when the server has not confirmed persistence.
- Browser unload saving is best effort and is not treated as guaranteed persistence.

## Testing

Test at minimum:

- Debounced typing.
- Unchanged content does not save.
- Successful save status.
- Validation, authentication, network, and server failures.
- Retry after temporary failure.
- Overlapping edits and stale revisions.
- Multiple tabs or clients updating the same note.
- Modification timestamp and revision increments.
- Editor state retention after failure.

## Requirement Mapping

| Autosave decision | Requirements |
| --- | --- |
| Automatic and controlled saving | FR-32, FR-33, NFR-06 |
| Save status | FR-34, NFR-17, NFR-38 |
| Failure handling | FR-35, NFR-18, NFR-20 |
| Stale-save prevention | FR-36, NFR-19, NFR-35 |
| Persistent metadata | FR-19, NFR-50 |

## Out of Scope

- Full offline editing
- Background synchronization after the browser closes
- Version history
- Collaborative editing
- Automatic conflict merging
