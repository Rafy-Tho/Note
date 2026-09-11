# Vertical Slice 02: Authentication and Authorization

## Includes

- Registration, Argon2id credentials, sign-in, sign-out, opaque sessions, expiry, revocation, CSRF, and rate limiting
- Separate application users and authentication accounts
- Email verification and resend behavior
- Password reset and session revocation through local auth accounts
- Google and Facebook callbacks and authenticated provider linking
- Authenticated context, protected routes, ownership-scoped data access, and safe not-found behavior
- Authentication screens, route guards, and session-aware navigation

## Data Model

`users` represents the application account and contains the normalized email, verification state, and timestamps. `auth_accounts` represents a sign-in method and contains `user_id`, `provider`, `provider_account_id`, and an optional `password_hash`. The password hash is present only for `local` accounts. `(provider, provider_account_id)` is unique, and user/provider pairs are unique.

Local accounts use the normalized email as `provider_account_id`. Registration creates the user and local auth account in one transaction. Migration `005_split_auth_accounts` moves existing local hashes and provider identities before removing `users.password_hash`.

## Social Sign-In

1. Validate the OAuth state, browser binding, provider callback, provider token, subject, and verified email assurance.
2. Look up the provider and provider account ID first. An existing account logs into its linked user.
3. If no provider account exists, require a verified provider email.
4. If no user has that email, create one user and one social auth account in one transaction, then create a session.
5. If a user already has that email, return `PROVIDER_LINK_REQUIRED` without creating a user or session.
6. The existing user signs in, starts an explicit CSRF-protected link flow, and completes a callback bound to the authenticated session. Linking uses the authenticated provider identity rather than comparing provider emails; an unverified or missing email is not used for account selection during explicit linking.
7. Provider-account uniqueness races are re-read and resolved to the linked user; email uniqueness races remain in the explicit link flow.

Sign-in and linking use the same provider-registered redirect URI. The server-side callback-state purpose distinguishes the flows, so a link callback can safely arrive at `/auth/{provider}/callback` and still create an auth account for the authenticated session.

## Gate

Users can authenticate safely, verified users can access private notes, provider collisions and unverified automatic email matching are rejected, same-email social login never duplicates a user, linked users can use both local and social methods, and User A cannot access User B data.

## Status

In progress. The auth-account migration, backend flow, provider assurance checks, and automated checks exist; browser journeys and complete resource integration remain pending.
