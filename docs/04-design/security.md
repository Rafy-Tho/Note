# Security Design

- Hash passwords with Argon2id.
- Use server-managed opaque PostgreSQL-backed sessions with secure HTTP-only cookies, expiry, and revocation.
- Protect state-changing requests with CSRF controls and rate-limit authentication and token flows.
- Validate all external input and use parameterized database access.
- Sanitize rich text before rendering.
- Scope every protected query and mutation by authenticated user ownership.
- Validate OAuth state, issuer, client, signature, expiry, subject, redirect URI, and verified-email claims on the server.
- Store only hashes of verification and reset tokens; enforce expiry and single use.
- Redact secrets and private content from logs and errors.

Required verification includes cross-user authorization tests, session tests, CSRF tests, rich-text security tests, autosave conflict tests, and backup recovery tests.
