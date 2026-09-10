# Task 15 - Authentication Expansion

## Status

In Progress

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
- Existing accounts are marked unverified by the migration and must verify before note access.
- OAuth callback state is stored as hashed, one-time database state bound to the browser and linking session when applicable.
- Password reset does not create passwords for provider-only accounts.

## Backend and Database

- [x] Add a migration for nullable password hashes and `email_verified_at`.
- [x] Add `auth_identities` with unique provider and subject constraints.
- [x] Add `auth_callback_states` with expiry, one-time consumption, and browser/session binding.
- [x] Add hashed, expiring, single-use email verification tokens.
- [x] Add hashed, expiring, single-use password-reset tokens with bounded attempts.
- [x] Add the Resend mail adapter and safe configuration validation.
- [x] Implement verification and resend services with rate limits.
- [x] Implement generic password-reset requests and reset confirmation.
- [x] Revoke all sessions atomically after a successful password reset.
- [x] Implement Google authorization-code callback validation.
- [x] Implement Facebook authorization-code callback validation.
- [ ] Implement provider resolution and authenticated linking.
- [ ] Preserve the existing opaque PostgreSQL session and CSRF behavior.

## Frontend

- [ ] Add Google and Facebook sign-in actions.
- [ ] Add verification-required and verification-success screens.
- [ ] Add resend-verification feedback and failure states.
- [ ] Add authenticated provider-linking controls.
- [ ] Handle provider cancellation, callback failure, collision, and retry states.

## Tests and Evidence

- Database migration applies, rolls back, and reapplies successfully.
- Database integration tests cover authentication expansion records and callback-state constraints.
- Email verification and resend API coverage is implemented.
- Password reset API coverage, Argon2id replacement, session revocation, and provider-only account behavior are implemented.
- Google authorization URL, callback claim validation, browser binding, account resolution, and no-automatic-merge coverage are implemented.
- Facebook authorization URL, Graph profile validation, browser binding, account resolution, and session coverage are implemented.
- Full backend tests pass: 61 tests.
- Targeted ESLint passes for the authentication implementation and tests. Repository backend lint remains blocked by the pre-existing `backend/test/api/organization.test.js:191` error.

- [ ] Test valid, invalid, expired, and reused verification tokens.
- [x] Test generic reset responses for registered and unknown email addresses.
- [ ] Test valid, invalid, expired, reused, and over-attempted password-reset tokens.
- [x] Test password hashing and complete session revocation after reset.
- [ ] Test verification resend rate limits and mail failures.
- [ ] Test provider state, redirect, subject, issuer, audience, expiry, and verified-email validation.
- [ ] Test provider identity collisions and no automatic email-based merging.
- [ ] Test unverified users cannot access private notes.
- [x] Test successful Google/Facebook sign-in creates the normal session.
- [ ] Test authenticated linking and safe unlinking rules.
- [ ] Add API, integration, frontend, and Playwright journeys.
- [ ] Verify provider secrets, codes, tokens, and verification tokens are never logged or returned.

## Completion Gate

Users cannot access private notes until email verification succeeds. Users can reset passwords securely through verified email. Valid Google and Facebook users can sign in, existing users can link providers securely, and all callback, verification, reset, collision, and failure tests pass.
