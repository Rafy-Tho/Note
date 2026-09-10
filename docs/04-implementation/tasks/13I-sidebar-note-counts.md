# Task 13I - Sidebar Note Counts

## Status

In Progress

## Objective

Show useful, ownership-safe note counts throughout workspace navigation without adding a count to Search or loading complete note collections just to calculate badges.

## Scope

- Show active note count for Notes.
- Show active and archived favorite note count for Favorites.
- Show archived note count for Archive.
- Show trashed note count for Trash.
- Show active and archived note counts for each notebook.
- Show active and archived note counts for each tag.
- Do not show a count for Search.
- Show the number of notes assigned to any notebook beside the parent Notebooks navigation item.
- Show the number of distinct tagged notes beside the parent Tags navigation item.
- Return all counts through one authenticated aggregate request.
- Keep every aggregate query scoped to the authenticated user.
- Refresh counts after note and organization mutations.
- Preserve responsive, keyboard, screen-reader, loading, and error behavior.

## Backend Checklist

- [x] Add `GET /workspace/sidebar-counts`.
- [x] Aggregate top-level counts by note state and favorite state.
- [x] Aggregate counts grouped by owned notebook and tag.
- [x] Add ownership and state-rule API coverage.
- [x] Add repository/service coverage for empty and populated results.

## Frontend Checklist

- [x] Add the sidebar-counts API client and React Query key.
- [x] Render counts beside top-level navigation items except Search.
- [x] Render counts beside notebook and tag rows.
- [x] Keep counts available to assistive technology without relying on color.
- [x] Invalidate counts after note, notebook, and tag mutations.
- [x] Handle loading and failed count requests without blocking navigation.

## Acceptance Criteria

- **Given** an authenticated user, **when** the sidebar loads, **then** counts include only that user's notes.
- **Given** active, archived, and trashed notes, **then** each top-level count matches its destination view.
- **Given** a notebook or tag, **then** its count includes only active and archived notes assigned to or using it.
- **Given** Search, **then** no count is rendered beside Search.
- **Given** the parent Notebooks navigation item, **then** its badge shows the number of active or archived notes assigned to any notebook.
- **Given** the parent Tags navigation item, **then** its badge shows the number of distinct active or archived notes with at least one tag.
- **Given** a note is created, trashed, restored, favorited, archived, moved, or permanently deleted, **then** affected counts refresh after server confirmation.
- **Given** a tag or notebook is created, renamed, or deleted, **then** sidebar navigation remains correct and counts do not expose another user's data.
- **Given** the count request fails, **then** navigation remains usable and an accessible non-blocking failure state is shown.
- **Given** a mobile or tablet drawer, **then** count badges remain readable and do not cause horizontal scrolling.

## Verification Commands

```text
npm run lint --workspace frontend
npm test --workspace frontend
npm run build --workspace frontend
npm run lint --workspace backend
npm test --workspace backend
npm run test:e2e
```

Browser verification remains subject to the existing local Chromium availability blocker. Backend and frontend lint, tests, and frontend build pass; focused browser verification remains pending.
