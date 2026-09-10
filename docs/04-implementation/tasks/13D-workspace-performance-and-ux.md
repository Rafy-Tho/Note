# Task 13D - Workspace Performance and UX Hardening

## Status

In Progress

Core implementation and automated checks are complete. Browser verification remains pending because the local Playwright Chromium executable is unavailable, and focused component coverage for navigation guards remains to be added.

## Objective

Make note selection and editing feel immediate and predictable by removing duplicate workspace requests, preventing stale detail-fetch loops, preserving unsaved drafts during navigation, and reducing unnecessary rendering and payload work.

This task is a hardening slice for the existing workspace. It must preserve the approved three-area desktop layout, mobile collection/editor flow, URL-driven navigation, authentication boundaries, autosave revision protection, and API response conventions.

## Depends On

- `12A-frontend-routing-and-context.md`
- `12-cross-slice-ui-intergration.md`
- `13C-frontend-hybrid-structure.md`
- `../../03-design/03-api.md`
- `../../03-design/07-autosave.md`
- `../../03-design/08-ui-ux.md`
- `../02-development-standards.md`

## Problem Statement

The current workspace has several related performance and data-loss risks:

- Collection and selected-note routes are separate route branches, so moving from a list to an editor can remount `Workspace` and refetch all active workspace queries.
- React Query uses its default zero `staleTime`, so cached data is immediately eligible for refetch after a remount or focus event.
- The selection effect in `Workspace.jsx` creates fallback arrays during render and manually calls `fetchQuery()` when a route note is not present in a loaded collection. A stale cached detail query can therefore be requested repeatedly.
- Favorites, archive, and tag rows use the search-result handler. That handler performs an unnecessary detail request and navigates to the active Notes route even when the note belongs to another collection.
- Note selection changes local state before the unsaved-change blocker completes. A cancelled navigation can replace the current draft.
- List endpoints return full rich-text documents, and the collection repeatedly traverses those documents to create previews.
- The editor compares complete serialized documents during synchronization, which adds main-thread work for large notes.
- Tag controls fetch the same tag collection outside React Query.
- The global query cache is not cleared when the authenticated session changes or ends.

## Scope

### Route and component lifecycle

- Keep one workspace shell mounted while navigating between workspace collections and selected notes.
- Keep existing collection URLs stable.
- Add a selected-note search route so search context is not discarded when a result opens.
- Keep route parameters and search parameters as the source of truth for view, note, tag, and search state.

### Query and request lifecycle

- Replace the manual selection-time detail fetch with a dedicated, enabled detail query.
- Use stable query data and stable empty values in selection derivation.
- Use TanStack Query's `useInfiniteQuery` for the primary active Notes list so additional pages load incrementally instead of loading the complete collection at once.
- Configure explicit cache, retry, and focus-refetch behavior for workspace queries.
- Pass `AbortSignal` from query functions through the frontend request layer to `fetch`.
- Avoid detail requests when a complete note is already available in the active collection cache.
- Ignore or abort obsolete requests during rapid note navigation.

### Draft and navigation safety

- Do not replace the selected note until navigation has been approved.
- Save or explicitly confirm discarding a dirty draft before changing notes, collections, or signing out.
- Preserve the current draft when navigation is cancelled or a detail request fails.
- Keep autosave states and revision-conflict recovery aligned with `07-autosave.md`.

### Rendering and payload work

- Reduce the render boundary between the collection and editor.
- Stabilize callbacks passed to presentational workspace components.
- Avoid serializing the complete editor document on every synchronization render.
- Reuse the cached tags query in tag controls.
- Return lightweight note list projections with a preview and load the full document for the editor.

### Verification

- Add focused unit/component tests for request deduplication, route selection, cancellation, dirty navigation, cache clearing, and autosave behavior.
- Verify the browser network log and React render behavior for desktop and mobile workflows.

## Target Route Model

The workspace route should have one stable parent component. Collection and selected-note paths should be child states of that parent rather than independent route branches that remount the workspace.

| Route | Purpose |
| --- | --- |
| `/workspace` | Redirect to `/workspace/notes` |
| `/workspace/notes` | Active notes list |
| `/workspace/notes/:noteId` | Active notes with selected editor note |
| `/workspace/favorites` | Favorite notes list |
| `/workspace/favorites/:noteId` | Favorite notes with selected editor note |
| `/workspace/archive` | Archived notes list |
| `/workspace/archive/:noteId` | Archived notes with selected editor note |
| `/workspace/tags` | Tag browser |
| `/workspace/tags/:tagId` | Notes filtered by tag |
| `/workspace/tags/:tagId/:noteId` | Tagged notes with selected editor note |
| `/workspace/search?q=term&page=1` | Search results |
| `/workspace/search/:noteId?q=term&page=1` | Search results with selected editor note |
| `/workspace/trash` | Trash and recovery actions |

Opening a result must preserve the originating collection. Search navigation should retain `q` and `page` parameters when moving to the selected-note search route.

## Target Selection Model

Selection is derived from the route and query state. It must not be driven by an effect that starts an unbounded request loop.

The intended resolution order is:

1. Resolve the route note from the currently loaded collection data.
2. Resolve a cached full note from `workspaceQueryKeys.note(noteId)`.
3. Enable one detail query for the route note when the list does not contain the full note.
4. Show a note-loading state while the detail query is pending.
5. Show a missing or unauthorized-resource state when the detail query returns the standard not-found error.
6. Keep the previous draft intact when a replacement note cannot be loaded.

The implementation must not call `fetchQuery()` on every render. Query functions must receive the query context signal, and obsolete detail requests must not update the active editor.

## Query Policy

The exact durations may be tuned after measurement, but they must be explicit rather than relying on React Query defaults.

- Workspace collection data should have a short non-zero `staleTime` to avoid refetching during normal route transitions.
- The primary Notes list should use `useInfiniteQuery` with `pageParam` mapped to the existing `page` API parameter and a bounded `limit`.
- `getNextPageParam` must stop when the loaded item count reaches `pagination.total`; it must not request an empty page repeatedly.
- Pages must be flattened in stable order for rendering, and only one `fetchNextPage` operation may be active at a time.
- Use an intersection-observer sentinel near the end of the list, with an accessible `Load more notes` control as a fallback for keyboard and assistive-technology users.
- Changing the Notes list filter or authenticated user must reset the page sequence instead of appending pages from a different query.
- Individual note details may use a longer `staleTime` because edits update the detail cache directly after a successful save.
- Search results should remain keyed by normalized query and page.
- Automatic retry should be limited and should not retry validation, authorization, or revision-conflict failures.
- Window-focus refetching should be disabled for workspace data unless a specific query requires it.
- Logout, session expiry, and authenticated-user changes must clear private workspace queries.

The query client remains the shared application infrastructure. No new global state library is introduced.

## Infinite Notes List

The active Notes collection is the first consumer of infinite pagination. The existing API contract remains page-based:

```js
useInfiniteQuery({
  queryKey: workspaceQueryKeys.notes,
  initialPageParam: 1,
  queryFn: ({ pageParam, signal }) =>
    notesApi.list({ page: pageParam, limit: 20 }, { signal }),
  getNextPageParam: (lastPage, allPages) => {
    const loaded = allPages.reduce((count, page) => count + page.data.length, 0);
    return loaded < lastPage.pagination.total
      ? lastPage.pagination.page + 1
      : undefined;
  },
});
```

The exact frontend response normalization may differ, but the behavior must remain equivalent:

- Flatten `data` from all loaded pages for the Notes list.
- Preserve page order and avoid duplicate note IDs.
- Do not fetch the next page while `isFetchingNextPage` is true.
- Stop requesting pages when `hasNextPage` is false.
- Keep already loaded pages visible while the next page is loading.
- Show a non-blocking loading indicator for the next page rather than replacing the entire list.
- Provide an accessible retry action when loading the next page fails.
- Use the same infinite-query cache when selecting a note from any loaded page.
- Update or remove a note across every cached page after mutations, or invalidate the infinite query when an exact page update is unsafe.
- Reset the infinite list when the user changes filters or signs out.

The first page should load with the workspace's initial notes request. Further pages should be fetched only as the user approaches the end of the list or activates the fallback control. The implementation must not prefetch unbounded pages.

## Target Request and API Changes

### Abortable requests

Feature API methods that can be used by queries should accept an optional request options object. The request layer must forward `signal` to `fetch` while preserving credentials, CSRF headers, and JSON response handling.

Example query shape:

```js
queryFn: ({ signal }) => notesApi.get(noteId, { signal })
```

The paginated notes list must preserve collection metadata instead of using the single-resource response helper. The target list method should accept both filters and request options and return the API collection shape:

```js
notesApi.list({ page, limit }, { signal })
// { data: [...], pagination: { page, limit, total } }
```

This metadata is required by `getNextPageParam`. Existing non-infinite consumers must be updated to read `data` from the collection response or use a shared response normalizer.

### Lightweight collection projections

Collection endpoints should not send the complete `contentJson` document for every row. List responses should include the fields needed to render and select a row:

```json
{
  "id": "note-id",
  "title": "Note title",
  "preview": "First visible text from the note",
  "state": "active",
  "isFavorite": false,
  "tags": [],
  "revision": 3,
  "updatedAt": "2026-09-10T12:00:00.000Z"
}
```

`GET /notes/:noteId` continues to return the full `contentJson` document required by the editor. The list projection and detail response must preserve ownership filtering, pagination, state rules, and the existing success/error envelope.

The preview should be generated from the server-side searchable/plain-text projection or an equivalent bounded value. The client must not need to traverse a large rich-text document merely to render a list row.

## Component Boundaries

- `Workspace` or a stable workspace container owns URL state and shared collection queries.
- A dedicated selection/detail layer resolves the selected note and its loading/error states.
- Editor draft and autosave state should be isolated from collection rendering where practical.
- `WorkspaceCollection` should not rerender for every editor keystroke when its inputs have not changed.
- `WorkspaceEditor` should not recreate independent data-fetching clients for tags.
- Presentational children may use `memo` only when their props are stable and the render reduction is measurable.

Avoid adding abstractions that do not address a measured workspace render or request problem.

## Autosave Requirements

- A clean note click must not issue `PATCH /notes/:noteId`.
- A dirty note must not be replaced before the user chooses to save, discard, or cancel.
- Only one save request may be active for a note.
- Continued typing while a save is active must queue the latest draft.
- A save response for an old note must never replace the current note draft.
- A save response must not replace newer local content.
- Save status must not report `Saved` before server confirmation.
- Editor blur and controlled navigation should attempt to flush pending changes as required by `07-autosave.md`.

## Implementation Checklist

### Routing and selection

- [x] Restructure workspace routes under one stable parent component.
- [x] Add `/workspace/search/:noteId` and preserve search parameters when opening a result.
- [x] Split collection-note, search-result, trash, and restore navigation handlers.
- [x] Route archive, favorite, tag, and search notes to their correct collection context.
- [x] Replace the manual detail-fetch effect with a guarded detail query.
- [x] Use stable empty constants and query-derived selection inputs.
- [x] Add loading, missing, unauthorized, and detail-request failure states.

### Query and transport

- [x] Set explicit workspace `staleTime`, `gcTime`, retry, and focus-refetch policies.
- [x] Replace the primary Notes list query with `useInfiniteQuery` using the existing page/limit API parameters.
- [x] Preserve collection `data` and `pagination` metadata in `notesApi.list()` for infinite-page calculations.
- [x] Flatten loaded Notes pages without duplicate rows and calculate `hasNextPage` from server pagination.
- [x] Add an intersection-observer trigger and accessible `Load more notes` fallback.
- [x] Keep loaded pages visible during next-page loading and expose page-load retry feedback.
- [x] Update or invalidate every cached Notes page after note mutations.
- [x] Forward `AbortSignal` through `authApi` and feature API methods.
- [x] Abort or ignore obsolete detail requests during rapid navigation.
- [x] Clear private query data on logout, session expiry, and user changes.
- [x] Reuse the cached tags query in `TagControls`.
- [x] Update tag mutation cache behavior after create, assign, and remove operations.

### Data and rendering

- [x] Split list and detail note response projections.
- [x] Add bounded server-generated note previews.
- [x] Stabilize workspace callbacks and isolate editor state updates from collection rendering.
- [x] Synchronize external Tiptap content only when note identity or server revision changes.
- [x] Remove avoidable full-document serialization from frequent render paths.
- [x] Keep the existing responsive layout and accessibility states intact.

### Tests and verification

- [ ] Test one detail request for a route note not present in a collection.
- [ ] Test that a missing route note does not produce repeated requests.
- [ ] Test that opening a loaded collection note does not refetch all workspace collections.
- [x] Test that the Notes list loads the next page only when requested and stops at the server total.
- [ ] Test that rapid scroll/intersection events do not issue concurrent duplicate page requests.
- [ ] Test page-load failure and accessible retry behavior.
- [ ] Test note selection and mutation updates across multiple loaded Notes pages.
- [ ] Test archive, favorites, tags, trash, and search navigation targets.
- [ ] Test search query and page preservation when opening and returning from a result.
- [ ] Test cancelled dirty-note navigation preserves the current draft.
- [ ] Test save-before-navigation behavior and save failure handling.
- [ ] Test rapid navigation does not allow stale detail responses to win.
- [ ] Test logout/session changes remove private query data.
- [ ] Test unchanged editor content does not issue a save request.
- [ ] Verify network request counts and render behavior on supported viewport groups.

## Acceptance Criteria

- Navigating between workspace collections and selected notes does not remount the workspace shell.
- Opening a note already present in a loaded collection does not issue a duplicate detail request.
- Opening a note that requires detail loading issues no more than one active detail request for that note.
- The primary Notes list loads incrementally through `useInfiniteQuery`, preserves loaded pages while fetching more, and stops at the server-reported total.
- Repeated scroll/intersection events do not create duplicate or concurrent requests for the same Notes page.
- Notes page-load failures provide a retryable, accessible state without discarding already loaded pages.
- Missing or unauthorized notes do not cause repeated network requests and do not leave an unrelated old note visible as the selected editor.
- Favorites, archive, tag, trash, and search selections preserve the correct route context.
- Search query and page state survive opening a result and returning to the collection.
- A clean note click does not issue an autosave `PATCH` request.
- Unsaved changes are never silently replaced by a note click, collection switch, browser navigation, or sign-out.
- Obsolete detail requests cannot replace the current editor draft.
- Collection payloads do not include full rich-text documents when only a row preview is needed.
- Logging out or changing users does not expose cached private notes from another session.
- Existing API ownership, CSRF, autosave revision, responsive, keyboard, and accessibility behavior remains valid.

## Verification Commands

```text
npm run lint --workspace frontend
npm test --workspace frontend
npm run build --workspace frontend
npm test --workspace backend
npm run lint --workspace backend
npm run test:e2e
```

Browser verification remains subject to the repository's existing Playwright/Chromium availability blocker.

## Completion Gate

The workspace has no duplicate or looping note-detail requests in the covered flows, no critical draft-loss path, explicit query lifecycle behavior, protected query-cache transitions, lightweight collection payloads, passing frontend/backend checks, and verified desktop/mobile core journeys.

## Evidence

Implementation evidence:

- Stable nested workspace routes keep `Workspace` mounted while collection and note URLs change.
- The active Notes list uses `useInfiniteQuery`, server pagination metadata, an IntersectionObserver sentinel, and an accessible load-more fallback.
- Note details use an enabled, abortable query instead of the previous render-triggered `fetchQuery()` effect.
- Collection responses now use bounded previews without returning full `contentJson`; detail responses remain complete.
- React Query cache defaults, logout cache clearing, tag-query reuse, and editor synchronization were updated.
- Frontend lint passes; frontend Vitest passes with 6 files and 13 tests.
- Backend lint passes; backend Vitest passes with 19 files and 79 tests.
- Frontend production build passes with the existing large-bundle warning.
- Playwright execution was attempted but is blocked because the local Chromium executable is unavailable.

The initial review identified affected files including:

- `frontend/src/app/router.jsx`
- `frontend/src/app/queryClient.js`
- `frontend/src/features/auth/context/AuthContext.jsx`
- `frontend/src/features/auth/services/authApi.js`
- `frontend/src/features/workspace/components/Workspace.jsx`
- `frontend/src/features/workspace/components/WorkspaceCollection.jsx`
- `frontend/src/features/workspace/components/WorkspaceEditor.jsx`
- `frontend/src/features/workspace/components/NoteEditor.jsx`
- `frontend/src/features/workspace/hooks/useAutosave.js`
- `frontend/src/features/workspace/hooks/useWorkspaceQueries.js`
- `frontend/src/features/workspace/hooks/useWorkspaceMutations.js`
- `frontend/src/features/tags/components/TagControls.jsx`
- `backend/src/modules/notes/notes.repository.js`
- `docs/03-design/03-api.md`
