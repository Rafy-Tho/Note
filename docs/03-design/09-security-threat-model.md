# Security Threat Model

## Purpose

This document identifies the main MVP security threats and the controls required to protect private user notes.

## Protected Assets

- User accounts and password hashes
- Session cookies and session records
- Notes and rich-text content
- Notebooks, tags, favorites, and note states
- Database credentials and application secrets

## Trust Boundaries

```text
Untrusted browser input
          |
          v
      HTTPS API
          |
          v
   Application rules
          |
          v
      PostgreSQL
```

The browser, request data, route IDs, search queries, and rich-text content are untrusted.

## Threats and Controls

| Threat | Control |
| --- | --- |
| User accesses another user's note | Scope every query and mutation by authenticated `user_id`. |
| Stolen or weak credentials | Use Argon2id password hashing, HTTPS, generic login errors, and rate limiting. |
| Session theft | Use opaque HTTP-only, Secure, SameSite cookies, expiry, revocation, and no token logging. |
| CSRF | Use SameSite cookies and CSRF protection for state-changing requests. |
| Rich-text XSS | Sanitize or safely render content before display; test malicious markup. |
| SQL or input injection | Validate input and use parameterized database access. |
| Resource enumeration | Use safe not-found responses for missing and unauthorized resources. |
| Sensitive data exposure | Redact passwords, tokens, secrets, and private note content from logs and errors. |
| Data corruption or partial updates | Use validation, constraints, transactions, and revision checks. |
| Dependency vulnerability | Evaluate dependencies and test security updates. |
| Excessive requests or search abuse | Apply request limits, pagination, rate limiting, and query timeouts. |
| Production secret exposure | Keep secrets outside source code and restrict access to configuration. |

## Security Controls by Layer

| Layer | Required controls |
| --- | --- |
| Frontend | Safe rendering, no secrets, accessible error states, no authorization assumptions. |
| API | HTTPS, validation, CSRF protection, rate limits, safe errors, authentication middleware. |
| Application | Ownership checks, state rules, transactions, conflict protection. |
| Database | Foreign keys, unique constraints, parameterized access, restricted credentials, backups. |
| Operations | Secret management, dependency updates, logging, monitoring, recovery procedures. |

## Security Rules

1. The frontend is never a security boundary.
2. Every protected operation authenticates and authorizes the user.
3. User-provided content is unsafe until validated and sanitized.
4. Unauthorized responses must not reveal resource existence or content.
5. Security failures must not be hidden as successful operations.
6. Security-sensitive events must be logged without sensitive values.

## Verification Checklist

- User A cannot read, edit, search, move, archive, favorite, trash, restore, or delete User B data.
- Unauthenticated requests cannot access protected resources.
- Invalid or expired sessions are rejected.
- Sign-out revokes the session.
- Passwords and session tokens never appear in logs or responses.
- Malicious rich text cannot execute scripts.
- CSRF-protected state changes reject invalid requests.
- Invalid IDs and queries do not expose database details.
- Stale autosave revisions cannot overwrite newer content.
- Database failures do not leave partial relationships.
- Backup recovery works in the documented test procedure.

## Requirement Mapping

| Security area | Requirements |
| --- | --- |
| Authentication and sessions | FR-01-FR-04, NFR-08, NFR-13, NFR-15 |
| Authorization and isolation | FR-05, FR-43, FR-44, NFR-09, NFR-10, NFR-34 |
| Rich-text safety | FR-08, NFR-12, NFR-13 |
| Validation and safe errors | FR-40-FR-44, NFR-11, NFR-16, NFR-49 |
| Data integrity and recovery | NFR-18-NFR-21, NFR-50-NFR-52 |
| Dependency and configuration security | NFR-14, NFR-53, NFR-54, NFR-56 |

## Out of Scope

- Public sharing security
- Collaboration permissions
- Organization or team roles
- Multi-factor authentication
- Advanced fraud detection
- Compliance certification
