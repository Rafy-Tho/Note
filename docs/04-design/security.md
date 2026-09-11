# Security Design

- Hash passwords with Argon2id.
- Use server-managed opaque PostgreSQL-backed sessions with secure HTTP-only cookies, expiry, and revocation.
- Protect state-changing requests with CSRF controls and rate-limit authentication and token flows.
- Validate all external input and use parameterized database access.
- Sanitize rich text before rendering.
- Scope every protected query and mutation by authenticated user ownership.
- Validate OAuth state, issuer, client, signature, expiry, subject, redirect URI, and provider email assurance claims on the server.
- Never automatically link a social account to an existing account from an email match alone. Automatic account creation and email-based lookup require a verified provider email. Explicit linking requires an authenticated, verified session, CSRF-protected initiation, one-time callback state, and a provider identity that is not already linked elsewhere. Linking uses the authenticated provider identity rather than comparing provider emails; an unverified or missing email is never used to identify the account during explicit linking.
- Store only hashes of verification and reset tokens; enforce expiry and single use.
- Redact secrets and private content from logs and errors.

Required verification includes cross-user authorization tests, session tests, CSRF tests, rich-text security tests, autosave conflict tests, and backup recovery tests.
