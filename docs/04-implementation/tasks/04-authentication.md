# Task 04 - Authentication

## Status

Not Started

## Objective

Implement secure registration, sign-in, sessions, and sign-out.

## Depends On

- `02-database-foundation.md`
- `03-backend-foundation.md`
- `../../03-design/04-authentication.md`

## Checklist

- [ ] Implement registration with normalized unique email.
- [ ] Hash passwords with Argon2id.
- [ ] Implement sign-in with generic failure responses.
- [ ] Create secure HTTP-only session cookies.
- [ ] Implement expiry and session revocation.
- [ ] Implement sign-out.
- [ ] Add CSRF protection.
- [ ] Add authentication rate limiting.

## Tests and Evidence

- Registration, sign-in, and sign-out tests pass.
- Passwords and tokens are not logged or returned.
- Expired and revoked sessions are rejected.

## Completion Gate

Users can authenticate securely and access protected routes.
