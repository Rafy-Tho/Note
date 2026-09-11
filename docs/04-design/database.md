# Database Design

PostgreSQL is the source of truth. Schema changes use versioned migrations. Related changes use transactions. Foreign keys, unique constraints, ownership indexes, search projections, and revision checks protect integrity and performance.

Core data includes application users, authentication accounts, sessions, verification and reset tokens, notes, notebooks, tags, note-tags, and search projections. `users` represents an application account. `auth_accounts` represents a sign-in method belonging to a user and supports `local`, `google`, and `facebook` providers. Local password hashes exist only on local auth accounts; social accounts never store password hashes. `auth_accounts` enforces uniqueness on `(provider, provider_account_id)` and protected queries always include the authenticated user's ownership condition.

Local accounts use the normalized user email as `provider_account_id`. A local account requires a password hash, while a social account requires a null password hash. Related user and auth-account writes use one transaction so registration and social account creation cannot leave partial authentication state.

Destructive operations must have explicit state rules, confirmation where required, and a recovery or rollback plan.
