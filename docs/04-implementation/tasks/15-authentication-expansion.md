# Task 15 - Authentication Expansion

## Status

Not Started

## Objective

Add mandatory email verification, secure password reset, Google and Facebook sign-in, authenticated provider linking, and Resend-backed transactional email without changing the existing opaque session model.

## Depends On

- `04-authentication.md`
- `../../02-requirements/01-functional-requirements.md`
- `../../03-design/04-authentication.md`
- `../../03-design/02-database.md`
- `../../03-design/03-api.md`

## Decisions

- Email verification is required before private note access.
- Password reset is available through verified email and revokes all existing sessions.
- Google and Facebook are P0 providers.
- Telegram sign-in and sign-up are deferred.
- Provider identities are linked only from an authenticated session.
- Matching email addresses never automatically merge accounts.
- Resend is the planned transactional email provider.

## Backend and Database

- [ ] Add a migration for nullable password hashes and `email_verified_at`.
- [ ] Add `auth_identities` with unique provider and subject constraints.
- [ ] Add hashed, expiring, single-use email verification tokens.
- [ ] Add hashed, expiring, single-use password-reset tokens with bounded attempts.
- [ ] Add the Resend mail adapter and safe configuration validation.
- [ ] Implement verification and resend services with rate limits.
- [ ] Implement generic password-reset requests and reset confirmation.
- [ ] Revoke all sessions atomically after a successful password reset.
- [ ] Implement Google authorization-code callback validation.
- [ ] Implement Facebook authorization-code callback validation.
- [ ] Implement provider resolution and authenticated linking.
- [ ] Preserve the existing opaque PostgreSQL session and CSRF behavior.

## Frontend

- [ ] Add Google and Facebook sign-in actions.
- [ ] Add verification-required and verification-success screens.
- [ ] Add resend-verification feedback and failure states.
- [ ] Add authenticated provider-linking controls.
- [ ] Handle provider cancellation, callback failure, collision, and retry states.

## Tests and Evidence

- [ ] Test valid, invalid, expired, and reused verification tokens.
- [ ] Test generic reset responses for registered and unknown email addresses.
- [ ] Test valid, invalid, expired, reused, and over-attempted password-reset tokens.
- [ ] Test password hashing and complete session revocation after reset.
- [ ] Test verification resend rate limits and mail failures.
- [ ] Test provider state, redirect, subject, issuer, audience, expiry, and verified-email validation.
- [ ] Test provider identity collisions and no automatic email-based merging.
- [ ] Test unverified users cannot access private notes.
- [ ] Test successful Google/Facebook sign-in creates the normal session.
- [ ] Test authenticated linking and safe unlinking rules.
- [ ] Add API, integration, frontend, and Playwright journeys.
- [ ] Verify provider secrets, codes, tokens, and verification tokens are never logged or returned.

## Completion Gate

Users cannot access private notes until email verification succeeds. Users can reset passwords securely through verified email. Valid Google and Facebook users can sign in, existing users can link providers securely, and all callback, verification, reset, collision, and failure tests pass.
