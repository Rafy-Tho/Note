# Use Cases

The primary actors are an unauthenticated visitor, an authenticated user, and the application. Private use cases authenticate the user, validate input, verify ownership, apply business rules, persist changes, and return safe results.

Core use cases are registration, verification, sign-in, provider sign-in, provider linking, password reset, sign-out, create note, view note, edit note, autosave note, search notes, manage notebooks, manage tags, manage favorites, archive note, trash note, restore note, permanently delete note, and navigate the dashboard.

Each use case must reject invalid input, avoid leaking unavailable resources, and avoid reporting failed operations as successful. Detailed acceptance behavior is in `../02-requirements/acceptance-criteria.md`.
