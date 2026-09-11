# Database Design

PostgreSQL is the source of truth. Schema changes use versioned migrations. Related changes use transactions. Foreign keys, unique constraints, ownership indexes, search projections, and revision checks protect integrity and performance.

Core data includes users, sessions, provider identities, verification and reset tokens, notes, notebooks, tags, note-tags, and search projections. Protected queries always include the authenticated user's ownership condition.

Destructive operations must have explicit state rules, confirmation where required, and a recovery or rollback plan.
