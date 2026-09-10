# Task 04 - Authentication

## Status

Complete for the original password/session foundation. Authentication provider expansion is tracked in `15-authentication-expansion.md`.

## Objective

Implement the secure password authentication foundation and complete the registration, sign-in, session, and sign-out user slice.

## Depends On

- `02-database-foundation.md`
- `03-backend-foundation.md`
- `../../03-design/04-authentication.md`

## Backend

- [x] Implement registration with normalized unique email.
- [x] Hash passwords with Argon2id.
- [x] Implement sign-in with generic failure responses.
- [x] Create secure HTTP-only session cookies.
- [x] Implement expiry and session revocation.
- [x] Implement sign-out.
- [x] Add CSRF protection.
- [x] Add authentication rate limiting.

## Frontend

- [x] Add registration and sign-in screens.
- [x] Add client-side validation and safe server-error feedback.
- [x] Add sign-out behavior and session-aware routing.
- [x] Handle loading, success, and failure states.

## Integration and Tests

- [x] Connect the authentication screens to the API.
- [x] Add registration, sign-in, sign-out, and protected-route API journeys.
- [x] Verify expired and revoked sessions are rejected at the service boundary.

## Tests and Evidence

- Backend registration, sign-in, sign-out, CSRF, and protected-route tests pass.
- Passwords and tokens are not logged or returned.
- Expired and revoked sessions are rejected.
- Frontend screens, session-aware routing, API integration, and client validation are implemented.
- Browser journeys remain pending because no Playwright authentication spec exists yet.

## Completion Gate

Users can authenticate securely and access protected routes.

Email verification, password reset, and external-provider requirements are not covered by this completed baseline task; they require the expansion task and its separate completion gate.
