# Task 07 - Rich Text and Autosave

## Status

Not Started

## Objective

Implement the safe rich-text editing and reliable autosave vertical slice.

## Depends On

- `06-core-notes.md`
- `../../03-design/07-autosave.md`
- `../../03-design/09-security-threat-model.md`

## Backend

- [ ] Store and render the editor document safely.
- [ ] Generate searchable plain text.
- [ ] Add revision checks and stale-save prevention.
- [ ] Define the autosave update contract and failure responses.

## Frontend

- [ ] Integrate the selected rich-text editor into the note screen.
- [ ] Support the approved formatting features.
- [ ] Display Unsaved Changes, Saving, Saved, and Save Failed states.
- [ ] Preserve editor state during failures and retries.

## Integration and Tests

- [ ] Connect debounced editor changes to the revision-aware API.
- [ ] Add component, API, security, and end-to-end autosave tests.

## Tests and Evidence

- Formatting survives save and reload.
- Malicious rich text cannot execute.
- Failed saves retain editor state.
- Older saves cannot overwrite newer content.

## Completion Gate

Rich-text editing and autosave pass reliability and security checks.
