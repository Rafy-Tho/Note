# Authentication Design

## Purpose

This document defines how the MVP registers users, verifies email ownership, authenticates with passwords or supported external providers, creates sessions, and signs users out.

## MVP Scope

Included:

- Email and password registration
- Email and password sign-in
- Mandatory email verification before private note access
- Password reset through verified email
- Google sign-in
- Facebook sign-in
- Authenticated Google and Facebook identity linking
- Protected session state
- Sign-out and session revocation

Excluded:

- Telegram sign-in or sign-up
- Multi-factor authentication
- Account deletion
- Profile management

## Authentication Decision

Use server-managed sessions with an opaque session token:

```text
Browser cookie
      |
      v
Session middleware
      |
      v
Session record in PostgreSQL
      |
      v
Authenticated user context
```

Only a hash of the session token is stored in the database. The raw token exists only in the browser cookie.

## User Credentials and Identities

- Normalize email before lookup and storage.
- Enforce a unique normalized email.
- Validate email and password input at the API boundary.
- Hash passwords with Argon2id when a password credential exists.
- Never store, log, or return plaintext passwords.
- Use a generic sign-in error so account existence is not unnecessarily disclosed.
- Use the provider subject, not provider email, as the external identity key.
- Do not merge accounts automatically because email addresses match.

The account model supports one password credential and zero or more external identities. Google and Facebook identities may be added only from an authenticated account-linking flow. An external identity may belong to only one local account.

Existing accounts are marked unverified when the authentication expansion migration runs and must complete email verification before accessing private notes. Password reset applies only to accounts with a password credential; provider-only accounts receive the same generic reset response and must use their provider or an authenticated linking flow.

## Email Verification and Password Reset

New password accounts must verify their normalized email before accessing private notes. A verification record stores only a hash of a high-entropy, single-use token, its expiry, and its consumed timestamp. Tokens expire after a configurable period and verification-message requests are rate limited.

The application sends verification messages through a backend mail adapter using Resend in production. Mail credentials and sender configuration come from the environment. Tokens are never logged, returned by the API, or stored in plaintext.

An unverified account may access only the verification and sign-out flows. Verification failures must not reveal whether another email address belongs to an account.

Password reset uses the same backend mail adapter and a separate hashed, high-entropy, single-use reset token. Reset requests always return a generic response whether or not the email exists. Reset tokens expire, reset requests and token attempts are rate limited, and the raw token is never logged, stored, or returned by an API response.

After a valid reset token is consumed, the server hashes the new password with Argon2id, consumes the token in the same transaction, revokes every existing session for the user, and does not automatically sign the user in. A reset cannot be used to verify an unverified email address.

## External Provider Sign-In

Google and Facebook authentication use server-side authorization-code callbacks. The frontend never exchanges provider codes or stores provider access tokens.

The server must:

1. Generate and store a short-lived, one-time callback state in PostgreSQL, bound to the initiating browser binding and, for linking, the authenticated session.
2. Validate the callback state and redirect URI.
3. Exchange the authorization code server-to-server.
4. Validate the provider response, client identity, issuer or endpoint, expiry, and stable provider subject.
5. Require a verified provider email before creating a new local account.
6. Resolve the `(provider, provider_subject)` identity to the local user.
7. Create the existing opaque application session after successful resolution.

If a provider email matches an existing local account but its provider identity is not linked, the flow must stop and instruct the user to sign in and link the provider. It must not merge accounts automatically.

## Provider Linking

Linking requires an authenticated session and a verified local email. The same callback validation rules used for sign-in apply. The identity is stored only after confirming it is not linked to another user. Unlinking is allowed only when the account retains another usable sign-in method.

## Session Cookie

The session cookie shall use:

| Setting | Value |
| --- | --- |
| HttpOnly | Enabled |
| Secure | Enabled in production |
| SameSite | Lax |
| Path | `/` |
| Value | High-entropy opaque token |

Session tokens must not be stored in localStorage, URLs, logs, or API responses.

## Session Data

The Authentication implementation requires a session record containing:

- Session ID
- User ID
- Hashed session token
- Created timestamp
- Last-used timestamp
- Expiry timestamp
- Revoked timestamp, when revoked

The database design should add this structure when authentication is implemented.

## Session Lifecycle

```text
Sign in
  -> Validate credentials
  -> Create session
  -> Set secure cookie
  -> Return authenticated state

Protected request
  -> Read cookie
  -> Hash and find session
  -> Check expiry and revocation
  -> Attach user identity

Sign out
  -> Revoke session
  -> Clear cookie
```

Use a configurable seven-day idle timeout and thirty-day absolute timeout.

## Registration Flow

1. Receive email and password.
2. Normalize and validate the input.
3. Check the unique email constraint.
4. Hash the password.
5. Create the user in a transaction.
6. Return registration success without automatically creating a session.

The user signs in separately after registration.

## Sign-In Flow

1. Receive credentials over HTTPS.
2. Normalize the email.
3. Find the user and verify the password hash.
4. Create a new session and rotate any pre-authentication session state.
5. Set the secure session cookie.
6. Return the authenticated user context without sensitive fields.

Invalid credentials and invalid input must not create a session.

## Sign-Out Flow

1. Identify the current session.
2. Revoke the session in the database.
3. Clear the browser cookie.
4. Require sign-in for the next protected request.

## Request Protection

- Authentication middleware establishes `user_id` from a valid session.
- Authorization middleware is defined in `05-authorization.md`.
- State-changing cookie-authenticated requests require CSRF protection.
- Login and registration endpoints should use rate limiting.
- Expired or revoked sessions return an unauthenticated response.

## Failure Handling

- Duplicate email: reject registration without creating a second account.
- Invalid credentials: return a generic authentication error.
- Expired session: clear the cookie and require sign-in.
- Revoked session: deny the request.
- Database or service failure: do not create a partial user or session.
- Invalid, expired, or reused verification token: do not verify the email.
- Provider callback failure or cancellation: do not create or change a session or identity.
- Provider identity collision: reject linking without changing either account.
- Mail delivery failure: do not claim that a verification message was sent successfully.
- Invalid, expired, reused, or over-attempted reset token: do not change the password.
- Successful password reset: revoke all existing sessions before reporting success.

## Security Requirements

| Design decision | Requirements |
| --- | --- |
| Secure password hashing | FR-01, FR-02, NFR-08 |
| Protected session state | FR-02, FR-03, FR-04, NFR-09, NFR-13 |
| Secure cookie handling | NFR-08, NFR-13, NFR-15 |
| Safe errors and logs | FR-41, FR-42, NFR-16, NFR-49 |
| Email verification, password reset, and provider identity safety | FR-46-FR-55, NFR-08, NFR-13, NFR-34 |

## Handoff

The Authorization document defines resource ownership checks. The API document defines authentication endpoints and response formats. The Security Threat Model defines detailed abuse cases and controls.
