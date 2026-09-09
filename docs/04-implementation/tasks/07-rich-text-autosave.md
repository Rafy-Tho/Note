# Task 07 - Rich Text and Autosave

## Status

Not Started

## Objective

Implement safe rich-text editing and reliable autosave.

## Depends On

- `06-core-notes.md`
- `../../03-design/07-autosave.md`
- `../../03-design/09-security-threat-model.md`

## Checklist

- [ ] Integrate the selected rich-text editor.
- [ ] Support the approved formatting features.
- [ ] Store and render the editor document safely.
- [ ] Generate searchable plain text.
- [ ] Add Unsaved Changes, Saving, Saved, and Save Failed states.
- [ ] Add the 800 ms debounce.
- [ ] Add revision checks and stale-save prevention.
- [ ] Add retry and failure handling.

## Tests and Evidence

- Formatting survives save and reload.
- Malicious rich text cannot execute.
- Failed saves retain editor state.
- Older saves cannot overwrite newer content.

## Completion Gate

Rich-text editing and autosave pass reliability and security checks.
