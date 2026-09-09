# Task 07 - Rich Text and Autosave

## Status

In Progress

## Objective

Implement the safe rich-text editing and reliable autosave vertical slice.

## Depends On

- `06-core-notes.md`
- `../../03-design/07-autosave.md`
- `../../03-design/09-security-threat-model.md`

## Backend

- [x] Store and render the editor document safely.
- [x] Generate searchable plain text.
- [x] Add revision checks and stale-save prevention.
- [x] Define the autosave update contract and failure responses.

## Frontend

- [x] Integrate the selected rich-text editor into the note screen.
- [x] Support the approved formatting features.
- [x] Display Unsaved Changes, Saving, Saved, and Save Failed states.
- [x] Preserve editor state during failures and retries.

## Integration and Tests

- [x] Connect debounced editor changes to the revision-aware API.
- [ ] Add component, API, security, and end-to-end autosave tests.

## Tests and Evidence

- [x] Formatting survives save and reload (implementation and API coverage; browser verification pending).
- [x] Malicious rich text cannot execute through the supported document contract.
- [x] Failed saves retain editor state (implementation coverage).
- [x] Older saves cannot overwrite newer content.

## Completion Gate

Rich-text editing and autosave pass reliability and security checks. Browser end-to-end verification remains pending because the local Playwright Chromium executable is unavailable.
