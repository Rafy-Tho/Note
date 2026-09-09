# Authentication Design

## Purpose

This document defines how the MVP registers users, verifies credentials, creates sessions, and signs users out.

## MVP Scope

Included:

- Email and password registration
- Email and password sign-in
- Protected session state
- Sign-out and session revocation

Excluded:

- Password reset
- Email verification
- Social login
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

## User Credentials

- Normalize email before lookup and storage.
- Enforce a unique normalized email.
- Validate email and password input at the API boundary.
- Hash passwords with Argon2id.
- Never store, log, or return plaintext passwords.
- Use a generic sign-in error so account existence is not unnecessarily disclosed.

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

## Security Requirements

| Design decision | Requirements |
| --- | --- |
| Secure password hashing | FR-01, FR-02, NFR-08 |
| Protected session state | FR-02, FR-03, FR-04, NFR-09, NFR-13 |
| Secure cookie handling | NFR-08, NFR-13, NFR-15 |
| Safe errors and logs | FR-41, FR-42, NFR-16, NFR-49 |

## Handoff

The Authorization document defines resource ownership checks. The API document defines authentication endpoints and response formats. The Security Threat Model defines detailed abuse cases and controls.
