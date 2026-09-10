export function up(pgm) {
  pgm.sql(`
    ALTER TABLE users
      ALTER COLUMN password_hash DROP NOT NULL,
      ADD COLUMN email_verified_at TIMESTAMPTZ;

    CREATE TABLE auth_identities (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      provider TEXT NOT NULL CHECK (provider IN ('google', 'facebook')),
      provider_subject TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE (provider, provider_subject)
    );

    CREATE TABLE email_verification_tokens (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      token_hash TEXT NOT NULL UNIQUE,
      expires_at TIMESTAMPTZ NOT NULL,
      consumed_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE password_reset_tokens (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      token_hash TEXT NOT NULL UNIQUE,
      expires_at TIMESTAMPTZ NOT NULL,
      consumed_at TIMESTAMPTZ,
      attempt_count INTEGER NOT NULL DEFAULT 0 CHECK (attempt_count >= 0),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE auth_callback_states (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      state_hash TEXT NOT NULL UNIQUE,
      provider TEXT NOT NULL CHECK (provider IN ('google', 'facebook')),
      purpose TEXT NOT NULL CHECK (purpose IN ('sign_in', 'link')),
      session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
      browser_binding_hash TEXT NOT NULL,
      expires_at TIMESTAMPTZ NOT NULL,
      consumed_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      CHECK (purpose = 'sign_in' OR session_id IS NOT NULL)
    );

    CREATE INDEX auth_identities_user_id_idx
      ON auth_identities (user_id);
    CREATE INDEX email_verification_tokens_user_expiry_idx
      ON email_verification_tokens (user_id, expires_at);
    CREATE INDEX password_reset_tokens_user_expiry_idx
      ON password_reset_tokens (user_id, expires_at);
    CREATE INDEX auth_callback_states_expiry_idx
      ON auth_callback_states (expires_at, consumed_at);
  `);
}

export function down(pgm) {
  pgm.sql(`
    DROP INDEX IF EXISTS auth_callback_states_expiry_idx;
    DROP INDEX IF EXISTS password_reset_tokens_user_expiry_idx;
    DROP INDEX IF EXISTS email_verification_tokens_user_expiry_idx;
    DROP INDEX IF EXISTS auth_identities_user_id_idx;
    DROP TABLE IF EXISTS auth_callback_states;
    DROP TABLE IF EXISTS password_reset_tokens;
    DROP TABLE IF EXISTS email_verification_tokens;
    DROP TABLE IF EXISTS auth_identities;
    ALTER TABLE users
      DROP COLUMN IF EXISTS email_verified_at,
      ALTER COLUMN password_hash SET NOT NULL;
  `);
}
