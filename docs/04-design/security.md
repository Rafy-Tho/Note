# Security Design

- Hash passwords with Argon2id.
- Use server-managed opaque MySQL-backed sessions with secure HTTP-only cookies, expiry, and revocation.
- Protect state-changing requests with session-bound HMAC CSRF controls and same-origin checks. Unsafe requests must provide an allowed `Origin` or `Referer` by default; explicitly set `REQUIRE_SAME_ORIGIN_HEADERS=false` only for a trusted non-browser client boundary.
- Use exact configured CORS origins with credentials enabled; wildcard origins are not allowed.
- When `CORS_ORIGIN` is empty in development, configuration explicitly defaults to `http://localhost:5173`; production requires a non-empty exact-origin allowlist.
- `COOKIE_SAME_SITE=none` is disabled unless `ALLOW_CROSS_SITE_COOKIES=true`, `COOKIE_SECURE=true`, a non-empty exact CORS allowlist is configured, and `REQUIRE_SAME_ORIGIN_HEADERS=true`.
- Apply Helmet security headers, disable Express fingerprinting, and enable HSTS only when production HTTPS is active.
- Apply a global API rate limit and a shared authentication-flow rate limit. `RATE_LIMIT_STORE=memory` is process-local and emits a production warning; production refuses `BACKEND_INSTANCE_COUNT>1` unless `RATE_LIMIT_STORE=shared` and separate `api`/`auth` store adapters are injected into `createApp`.
- Limit JSON request bodies to the configured `REQUEST_BODY_LIMIT` value, defaulting to `1mb`, and return safe `413` parser errors.
- Apply HPP middleware with an extended query parser, reject nested query objects, and preserve repeated scalar values as arrays. Current route validators accept only scalar pagination/search/filter values unless an array contract is added explicitly.
- Validate all external input and use parameterized database access.
- Sanitize rich text before rendering.
- Rich text is stored as allowlisted Tiptap JSON. The server rejects unsupported nodes and attributes, unsafe links, oversized text, excessive node counts, and excessive nesting.
- Scope every protected query and mutation by authenticated user ownership.
- Validate OAuth state, issuer, client, signature, expiry, subject, redirect URI, and provider email assurance claims on the server.
- Never automatically link a social account to an existing account from an email match alone. Automatic account creation and email-based lookup require a verified provider email. Explicit linking requires an authenticated, verified session, CSRF-protected initiation, one-time callback state, and a provider identity that is not already linked elsewhere. Linking uses the authenticated provider identity rather than comparing provider emails; an unverified or missing email is never used to identify the account during explicit linking.
- Store only hashes of verification and reset tokens; enforce expiry and single use.
- Redact secrets and private content from logs and errors. Request logs record only the pathname, method, status, duration, and validated request ID; query strings, cookies, bodies, tokens, and private note content are not logged.
- Compress responses above the configured threshold, excluding authentication responses to reduce compression side-channel exposure.
- Configure `TRUST_PROXY` explicitly when deployed behind a known reverse proxy. It supports `false`, `true`, or a non-negative numeric hop count and is passed to Express unchanged; use a known numeric hop count in production and never enable unrestricted `true` trust.

Required verification includes cross-user authorization tests, session tests, CSRF tests, rich-text security tests, autosave conflict tests, and backup recovery tests.
