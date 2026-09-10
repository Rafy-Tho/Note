# Task 13F - Workspace Dialogs and Toast Feedback

## Status

In Progress

Shared dialog and workspace toast primitives are implemented. Frontend lint, Vitest (7 files, 18 tests), and production build pass. Browser verification remains subject to the existing local Chromium availability blocker.

## Objective

Replace browser-native prompts and confirmations with accessible application dialogs, and provide consistent non-blocking success feedback for workspace operations.

## Depends On

- `13D-workspace-performance-and-ux.md`
- `13E-editor-organization-controls.md`
- `../../03-design/08-ui-ux.md`
- `../../design/DESIGN.md`

## Scope

- Replace all frontend `window.prompt`, `window.confirm`, and `window.alert` usage.
- Provide shared dialogs with labeled content, explicit actions, Escape/cancel behavior, focus restoration, and responsive layout.
- Provide workspace-scoped toast notifications with success and error semantics, live-region announcements, dismissal, and bounded queue size.
- Preserve unsaved-draft protection and destructive-action confirmation behavior.
- Keep persistent loading and failure messages as inline alerts where they are needed for recovery.
- Do not show success feedback before server confirmation.

## Frontend Checklist

- [x] Add shared accessible dialog primitive.
- [x] Add workspace toast provider, viewport, and bounded queue.
- [x] Replace link URL prompt with a validated link dialog.
- [x] Replace notebook rename prompt with a rename dialog.
- [x] Replace workspace confirmation dialogs for navigation, deletion, trash, account unlinking, and dirty-note creation.
- [x] Add success toasts for confirmed workspace mutations.
- [x] Add helper tests for link validation and toast queue behavior.
- [x] Complete frontend lint, test, and build verification.
- [ ] Complete desktop and mobile browser verification.

## Acceptance Criteria

- **Given** a link action, **when** the user activates it, **then** an in-app dialog opens with a labeled URL field, cancel action, validation, and link-removal behavior.
- **Given** a notebook rename action, **when** the user activates it, **then** an in-app dialog opens and submits only a non-empty changed name.
- **Given** a destructive or dirty-navigation action, **when** confirmation is required, **then** an accessible in-app dialog is shown and cancel preserves the current resource or draft.
- **Given** a successful workspace mutation, **when** the server confirms it, **then** a toast announces the result without interrupting editing.
- **Given** a toast or dialog on mobile, **then** controls remain usable without horizontal scrolling and focus remains predictable.
- **Given** frontend source, **then** no browser-native prompt, confirm, or alert API is used.

## Verification Commands

```text
npm run lint --workspace frontend
npm test --workspace frontend
npm run build --workspace frontend
npm run test:e2e
```

Browser verification remains subject to the existing local Chromium availability blocker.

## Evidence

- No frontend `window.prompt`, `window.confirm`, or `window.alert` usage remains.
- Link URL and notebook rename use application dialogs with validation and explicit actions.
- Dirty navigation, note deletion, permanent deletion, notebook deletion, provider unlinking, and dirty-note creation use application confirmation dialogs.
- Workspace mutations announce confirmed outcomes through the shared toast viewport.
- `npm run lint --workspace frontend` passes.
- `npm test --workspace frontend` passes with 7 files and 18 tests.
- `npm run build --workspace frontend` passes with the existing large-bundle warning.
- Browser verification remains blocked because the local Chromium executable is unavailable.
