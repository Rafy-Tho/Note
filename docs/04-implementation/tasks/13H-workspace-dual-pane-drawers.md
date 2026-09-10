# Task 13H - Workspace Dual-Pane Drawers

## Status

In Progress

## Objective

Make the navigation sidebar and notes collection independently openable on small screens while keeping the editor as the primary surface.

## Scope

- Keep the desktop three-pane workspace available, with collapsible navigation and collection panes.
- Add a mobile/tablet notes-list toggle in the workspace header.
- Slide the navigation sidebar and notes collection over the editor.
- Allow only one auxiliary drawer to be open at a time.
- Close the active drawer with its toggle, backdrop, Escape, or successful selection.
- Preserve URL-driven navigation and unsaved-draft protection.
- Restore focus to the control that opened a drawer where practical.
- Respect reduced-motion preferences.

## Checklist

- [x] Coordinate navigation and collection drawer state.
- [x] Add a mobile notes-list toggle.
- [x] Add collection drawer slide-in/out styling.
- [x] Keep navigation and collection drawers mutually exclusive.
- [x] Close drawers from Escape and the shared backdrop.
- [x] Preserve desktop three-pane layout.
- [x] Add desktop Menu and Notes pane controls beside the brand.
- [ ] Complete desktop, tablet, and mobile browser verification.

## Acceptance Criteria

- **Given** a mobile workspace, **when** the user opens Menu, **then** the navigation drawer slides in and the collection drawer closes.
- **Given** a selected note, **when** the user opens Notes, **then** the notes collection slides over the editor without changing the selected-note URL.
- **Given** either drawer is open, **when** the user clicks the backdrop or presses Escape, **then** the drawer closes.
- **Given** the user selects a view or note, **then** the appropriate drawer closes after navigation is accepted.
- **Given** a dirty note, **when** drawer navigation changes the selected resource, **then** the existing confirmation dialog protects the draft.
- **Given** reduced motion is enabled, **then** drawer transitions are minimized by the global motion preference.

## Verification Commands

```text
npm run lint --workspace frontend
npm test --workspace frontend
npm run build --workspace frontend
npm run test:e2e
```

Browser verification remains subject to the existing local Chromium availability blocker.
