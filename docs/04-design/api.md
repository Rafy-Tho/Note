# API Design

The API is versioned under `/api/v1` and uses consistent JSON success and error shapes. Routes authenticate first, validate input second, enforce ownership third, apply business rules, then read or write through repositories.

Authentication uses one `users` record per application account and one or more `auth_accounts` records per sign-in method. Registration creates a user and a `local` auth account in one transaction. Social callbacks first resolve `(provider, provider_account_id)`. If no account exists, a verified provider email may create a new user and social auth account. If the email belongs to an existing user, the callback returns `PROVIDER_LINK_REQUIRED` without creating a user or session; the existing user must authenticate and explicitly complete the provider-link flow.

Provider-link callbacks require the authenticated session, CSRF-protected initiation, one-time state bound to the session and browser, and a provider identity that is not already linked elsewhere. Linking uses the authenticated provider identity rather than comparing provider emails; an unverified or missing provider email is never used to select the account. Existing API paths use the compatibility term `identities`, but they read and write `auth_accounts` and never expose provider account IDs or password hashes.

Provider sign-in and provider-link flows use the same registered OAuth redirect URI: `/auth/{provider}/callback`. The server-side callback state purpose distinguishes sign-in from linking, and the redirect URI used for authorization is also used for the provider token exchange.

API errors must be safe, actionable, and free of secrets, SQL, stack traces, private content, and cross-user resource information. Missing and unauthorized resources use safe not-found behavior.

Notes, authentication, organization, tags, search, and workspace endpoints must preserve the requirements and acceptance behavior. API changes require updates to this document and affected implementation evidence.
