# Vertical Slice 02: Authentication and Authorization

## Includes

- Registration, Argon2id credentials, sign-in, sign-out, opaque sessions, expiry, revocation, CSRF, and rate limiting
- Email verification and resend behavior
- Password reset and session revocation
- Google and Facebook callbacks and authenticated provider linking
- Authenticated context, protected routes, ownership-scoped data access, and safe not-found behavior
- Authentication screens, route guards, and session-aware navigation

## Gate

Users can authenticate safely, verified users can access private notes, provider collisions are rejected, and User A cannot access User B data.

## Status

In progress. Backend and frontend implementation exists; browser journeys and complete resource integration remain pending.
