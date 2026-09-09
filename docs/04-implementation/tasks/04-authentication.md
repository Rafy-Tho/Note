# Task 04 - Authentication

## Status

Not Started

## Objective

Implement the secure authentication foundation and complete the registration, sign-in, session, and sign-out user slice.

## Depends On

- `02-database-foundation.md`
- `03-backend-foundation.md`
- `../../03-design/04-authentication.md`

## Backend

- [ ] Implement registration with normalized unique email.
- [ ] Hash passwords with Argon2id.
- [ ] Implement sign-in with generic failure responses.
- [ ] Create secure HTTP-only session cookies.
- [ ] Implement expiry and session revocation.
- [ ] Implement sign-out.
- [ ] Add CSRF protection.
- [ ] Add authentication rate limiting.

## Frontend

- [ ] Add registration and sign-in screens.
- [ ] Add client-side validation and safe server-error feedback.
- [ ] Add sign-out behavior and session-aware routing.
- [ ] Handle loading, success, and failure states.

## Integration and Tests

- [ ] Connect the authentication screens to the API.
- [ ] Add registration, sign-in, sign-out, and protected-route journeys.
- [ ] Verify expired and revoked sessions are rejected.

## Tests and Evidence

- Registration, sign-in, sign-out, and protected-route tests pass.
- Passwords and tokens are not logged or returned.
- Expired and revoked sessions are rejected.

## Completion Gate

Users can authenticate securely and access protected routes.
