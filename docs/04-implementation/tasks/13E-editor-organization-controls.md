# Task 13E - Editor Organization Controls

## Status

In Progress

The compact editor organization control is implemented. The editor now shows only `Notebooks` and `Tags` buttons by default, with the complete workflows available in their panels. Frontend lint, Vitest (7 files, 18 tests), and build pass. Browser verification remains pending until the local Playwright Chromium executable is available.

## Objective

Make notebook and tag organization available from a clear, compact context bar at the top of the note editor without competing with the writing canvas.

## Depends On

- `09-minimum-tags.md`
- `11-organization-favorites-archive.md`
- `13D-workspace-performance-and-ux.md`
- `../../03-design/08-ui-ux.md`
- `../../design/DESIGN.md`

## Scope

- Keep the existing notebook and tag APIs, ownership checks, CSRF behavior, and query cache integration.
- Show only two organization buttons in the editor header: `Notebooks` and `Tags`.
- Open notebook and tag workflows in compact panels instead of rendering every control at once.
- Keep assigned tags visible as removable chips.
- Add inline `Create new` controls for notebooks and tags.
- Auto-assign a newly created notebook or tag to the current note after creation succeeds.
- Keep notebook rename and delete behind an explicit Manage control.
- Preserve loading, disabled, validation, mutation failure, and unsaved-editor behavior.
- Make the context bar wrap cleanly on mobile without horizontal scrolling.

## Frontend Checklist

- [x] Add the two-button editor organization control.
- [x] Move notebook and tag workflows into compact toggle panels.
- [x] Add notebook selection with a `No notebook` option.
- [x] Add notebook creation and automatic assignment.
- [x] Keep notebook rename/delete available through Manage.
- [x] Add assigned tag chips and accessible removal controls.
- [x] Add existing-tag assignment and new-tag creation controls.
- [x] Add responsive styling using the established dark design tokens.
- [x] Update the core browser journey selectors and organization coverage.
- [ ] Complete browser verification on desktop and mobile.

## Acceptance Criteria

- **Given** an open note, **when** the user changes the notebook select, **then** the note moves to that owned notebook or to no notebook.
- **Given** an open note, **when** the user creates a notebook, **then** it is created and assigned to the open note.
- **Given** an open note, **when** the user selects an existing tag, **then** the tag is assigned and shown as a chip.
- **Given** an open note, **when** the user creates a tag, **then** it is created, assigned, and shown as a chip.
- **Given** an assigned tag, **when** its remove control is activated, **then** only that note-tag association is removed.
- **Given** the editor is saving or an organization mutation is pending, **then** organization controls are disabled and no success state is shown before server confirmation.
- **Given** a mobile viewport, **then** the context bar wraps and remains usable without horizontal scrolling.

## Verification Commands

```text
npm run lint --workspace frontend
npm test --workspace frontend
npm run build --workspace frontend
npm run test:e2e
```

Browser verification remains subject to the existing local Chromium availability blocker.
