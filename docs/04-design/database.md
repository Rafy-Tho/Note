# Database Design

A MySQL-compatible server (MySQL 8.0 or MariaDB 11) is the source of truth. Schema changes use versioned migrations. Related changes use transactions. Foreign keys, unique constraints, ownership indexes, search projections, and revision checks protect integrity and performance. Queries avoid MariaDB-incompatible constructs such as correlated references inside derived tables, and check-constraint errors are recognized for both MySQL (`3819`) and MariaDB (`4025`).

Identifiers are UUIDs stored as `CHAR(36)` and generated in the application with `crypto.randomUUID()`; MySQL has no equivalent of `gen_random_uuid()` defaults. Timestamps use `DATETIME(3)` in UTC. Rich-text documents use the MySQL `JSON` type. Columns compared for exact equality, such as token and state hashes, use a binary collation, while email and normalized names use a case-insensitive collation. MySQL DDL statements cause implicit commits, so each migration is applied as an ordered sequence of statements and the applied version is recorded in `schema_migrations` only after every statement succeeds; failed migrations are repaired with the matching down steps.

Core data includes application users, authentication accounts, sessions, verification and reset tokens, notes, notebooks, tags, note-tags, and search projections. `users` represents an application account. `auth_accounts` represents a sign-in method belonging to a user and supports `local`, `google`, and `facebook` providers. Local password hashes exist only on local auth accounts; social accounts never store password hashes. `auth_accounts` enforces uniqueness on `(provider, provider_account_id)` and protected queries always include the authenticated user's ownership condition.

Local accounts use the normalized user email as `provider_account_id`. A local account requires a password hash, while a social account requires a null password hash. Related user and auth-account writes use one transaction so registration and social account creation cannot leave partial authentication state.

Search uses an InnoDB `FULLTEXT` index over the search projection columns and `MATCH ... AGAINST` in natural language mode. MySQL does not interpret the PostgreSQL `websearch_to_tsquery` operator syntax (quoted phrases, `-` exclusion, `OR`), and its ranking and minimum token length differ from PostgreSQL; the search projection columns remain the contract, but ranking behavior is MySQL-specific.

Destructive operations must have explicit state rules, confirmation where required, and a recovery or rollback plan.
