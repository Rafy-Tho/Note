# Task 12A - Frontend Routing and Application Context

## Status

In Progress

## Objective

Replace local authentication and workspace navigation state with shared authentication context and URL-driven React Router routes.

## Depends On

- `04-authentication.md`
- `06-core-notes.md`
- `07-rich-text-autosave.md`
- `08-trash-recovery.md`
- `10-search.md`
- `11-organization-favorites-archive.md`
- `12-cross-slice-ui-intergration.md`

## Scope

- Add `react-router-dom`.
- Add `AuthProvider` and `useAuth`.
- Add protected and public route guards.
- Add authenticated and unauthenticated layouts.
- Move authentication screens to dedicated URLs.
- Move workspace sections and selected notes to dedicated URLs.
- Preserve the existing authentication API, session cookies, CSRF behavior, workspace features, and visual design.
- Do not add settings, sharing, collaboration, or other out-of-scope screens.

## Authentication Routes

| Route | Screen |
| --- | --- |
| `/login` | Sign-in |
| `/register` | Account registration |
| `/verify-email` | Email verification |
| `/forgot-password` | Password reset request |
| `/reset-password?token=...` | Password reset confirmation |

Authenticated users visiting public authentication routes redirect to `/workspace/notes`.

Unauthenticated users visiting protected routes redirect to `/login`.

## Workspace Routes

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
| `/workspace/trash` | Trash and recovery actions |

Trash remains list-only because the current interface does not edit trashed notes.

## Application Structure

```text
frontend/src/
├── app/
│   ├── App.jsx
│   ├── providers.jsx
│   ├── queryClient.js
│   ├── router.jsx
│   └── layouts/
│       ├── AppLayout.jsx
│       └── AuthLayout.jsx
├── features/
│   └── auth/
│       ├── context/
│       │   └── AuthContext.jsx
│       ├── hooks/
│       │   └── useAuth.js
│       └── components/
│           ├── ProtectedRoute.jsx
│           └── PublicRoute.jsx
├── components/
│   └── common/
└── pages/
    ├── AuthPage.jsx
    ├── WorkspacePage.jsx
    └── NotFoundPage.jsx
```

The complete frontend hybrid structure and dependency boundaries are defined in `tasks/13C-frontend-hybrid-structure.md`. This task owns routing and context behavior; the later structure refactor owns file organization without changing those behaviors.

## Provider Composition

`main.jsx` should compose providers in this order:

```jsx
<StrictMode>
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  </QueryClientProvider>
</StrictMode>
```

## Auth Context Responsibilities

`AuthProvider` owns:

- Initial session loading.
- Current session state.
- Authentication status.
- Verification-required state.
- Authentication errors.
- Login.
- Logout.
- Session refresh.
- Applying a newly authenticated session.
- Clearing the session after logout or session expiry.

`useAuth()` must throw a clear error when used outside `AuthProvider`.

The context must not store session identifiers or tokens in localStorage, sessionStorage, or application URLs. Server-managed cookies remain the session mechanism.

## Workspace URL State

The workspace should use React Router as the source of truth:

| Current state | New source |
| --- | --- |
| `view` | Route pathname |
| `selected` | `:noteId` route parameter |
| `selectedTagId` | `:tagId` route parameter |
| `searchQuery` | `q` search parameter |
| `searchPage` | `page` search parameter |
| `mobilePane` | Local UI state |

`Workspace.jsx` should use `useParams()` for note and tag identifiers, `useSearchParams()` for search state, and `useNavigate()` for section, note, search, and back navigation.

## Component Changes

- Refactor `App.jsx` into the router entry point.
- Move authentication shell markup into `AuthLayout`.
- Move authenticated application wrapper behavior into `AppLayout`.
- Add `AuthPage` to select the authentication mode from the route.
- Add `WorkspacePage` to connect route parameters to `Workspace`.
- Refactor `Workspace.jsx` to derive view and selection from the URL.
- Update `WorkspaceSidebar` buttons to navigate to workspace routes.
- Update note selection to navigate to `:noteId`.
- Update search result opening to navigate to `/workspace/notes/:noteId`.
- Update note creation to navigate to the newly created note.
- Update editor back navigation to return to the active collection route.
- Preserve unsaved-change protection before route changes.
- Add a not-found screen for invalid application routes.

## React Router Configuration

Use `createBrowserRouter` and `RouterProvider`.

The route tree should contain public routes under `PublicRoute`, authentication pages under `AuthLayout`, protected routes under `ProtectedRoute`, workspace pages under `AppLayout`, a root redirect to `/workspace/notes`, and a not-found route.

## Testing

Add or update tests for:

- AuthProvider initial session loading.
- AuthProvider login and logout state changes.
- AuthProvider handling of expired or unauthenticated sessions.
- Public route redirection for authenticated users.
- Protected route redirection for unauthenticated users.
- Root redirect behavior.
- Workspace section URL navigation.
- Selected note URL navigation.
- Tag route parameter handling.
- Search query and pagination URL handling.
- Browser back navigation.
- Unsaved-change protection during route changes.
- Invalid route handling.
- Authentication tokens and private note content not being placed in URLs or logs.

Required verification:

```text
npm run lint --workspace frontend
npm test --workspace frontend
npm run build --workspace frontend
npm run test:e2e
```

## Acceptance Criteria

- Authentication state is available through `useAuth()`.
- Authentication logic is not duplicated in `App.jsx`.
- Unauthenticated users cannot access workspace routes.
- Authenticated users cannot access public authentication routes.
- Every workspace section has a stable URL.
- Selected notes can be bookmarked and restored through their URL.
- Search query and page survive refresh and browser navigation.
- Browser back and forward navigation work correctly.
- Unsaved note changes are not silently discarded.
- Existing API security and server-managed session behavior remain unchanged.
- Existing desktop, tablet, mobile, loading, empty, error, and accessibility behavior remains intact.

## Completion Gate

The route map, authentication context, route guards, layouts, workspace URL state, tests, lint, build, and supported browser journeys all pass without regressions.

## Implementation Evidence

- `react-router-dom` added to the frontend dependency set.
- `AuthProvider`, `useAuth`, public/protected route guards, `AuthLayout`, `AppLayout`, authentication pages, workspace pages, and not-found handling implemented.
- Authentication routes and workspace collection/note routes are defined in `frontend/src/app/router.jsx`.
- Workspace view, selected note, selected tag, search query, and search page are URL-driven; mobile pane state remains local.
- Workspace route mapping tests added in `frontend/src/features/workspace/routing.test.js`.
- Frontend lint passes.
- Frontend Vitest passes with 9 tests.
- Frontend production build passes.
- Browser journey verification remains pending until the local Playwright Chromium executable is available.
