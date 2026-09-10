# Task 13G - Sidebar Tag and Notebook Management

## Status

In Progress

## Objective

Make owned tags and notebooks easy to browse and manage from the workspace sidebar without adding persistent visual clutter to the editor or navigation.

## Depends On

- `09-minimum-tags.md`
- `11-organization-favorites-archive.md`
- `13D-workspace-performance-and-ux.md`
- `13F-workspace-dialogs-and-toast-feedback.md`
- `../../03-design/03-api.md`
- `../../03-design/08-ui-ux.md`

## Scope

- Add expandable Tags and Notebooks sections to the workspace sidebar.
- Show one compact `+` action per section for creating a tag or notebook.
- Show owned tags and notebooks alphabetically when expanded.
- Keep the existing tag navigation behavior to `/workspace/tags/:tagId`.
- Make the Notebooks navigation item URL-driven through `/workspace/notebooks` and notebook-filtered child routes.
- Show rename/delete row actions only on hover or keyboard focus.
- Add ownership-safe tag rename and delete API operations.
- Delete tag associations without deleting notes, and refresh affected search projections transactionally.
- Reuse the shared tag query used by the editor and tag browser.
- Reuse the shared notebook query used by the editor.
- Preserve dirty-note navigation protection, responsive drawer behavior, dialogs, toasts, and keyboard accessibility.

## Frontend Checklist

- [x] Add the expandable sidebar Tags section.
- [x] Add the expandable sidebar Notebooks section.
- [x] Add sidebar notebook create, rename, and delete dialogs.
- [x] Add sidebar tag navigation and selected state wiring.
- [x] Add the sidebar create-tag dialog.
- [x] Add compact rename/delete row actions and dialogs.
- [x] Add shared frontend tag CRUD API methods.
- [ ] Add complete component/browser verification.

## Backend Checklist

- [x] Add `PATCH /tags/:tagId` for owned tag rename.
- [x] Add `DELETE /tags/:tagId` for owned tag deletion.
- [x] Preserve per-user normalized-name uniqueness.
- [x] Remove deleted-tag associations while preserving notes.
- [x] Refresh search projections after tag rename and deletion.
- [ ] Add complete API integration coverage for tag CRUD and cross-user access.

## Acceptance Criteria

- **Given** the sidebar Tags section is collapsed, **when** the user expands it, **then** owned tags appear in alphabetical order without disrupting the navigation layout.
- **Given** the sidebar Notebooks section is collapsed, **when** the user expands it, **then** owned notebooks appear in alphabetical order without disrupting the navigation layout.
- **Given** the user selects a sidebar tag, **then** the workspace opens the matching tag collection and preserves unsaved-note protection.
- **Given** the user selects the Notebooks navigation item, **then** the URL changes to `/workspace/notebooks` and browser history/refresh preserve that view.
- **Given** the user activates `+`, **then** an accessible dialog creates a unique owned tag and refreshes the sidebar after server confirmation.
- **Given** the user renames a tag, **then** the name updates in the sidebar, editor, tag browser, and search projection.
- **Given** the user deletes a tag, **then** its associations are removed, notes remain intact, and the tag disappears from the sidebar and tag browser.
- **Given** the user creates, renames, or deletes a notebook from the sidebar, **then** the shared notebook list and editor controls reflect the confirmed server state.
- **Given** a user attempts to rename or delete another user's tag, **then** the API returns the safe not-found behavior and changes nothing.
- **Given** a mobile sidebar drawer, **then** the Tags section remains keyboard and touch accessible without horizontal scrolling.

## Verification Commands

```text
npm run lint --workspace frontend
npm test --workspace frontend
npm run build --workspace frontend
npm run lint --workspace backend
npm test --workspace backend
npm run test:e2e
```

Browser verification remains subject to the existing local Chromium availability blocker.
