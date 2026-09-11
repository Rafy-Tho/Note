export function up(pgm) {
  pgm.sql(`
    ALTER TABLE auth_identities RENAME TO auth_accounts;
    ALTER TABLE auth_accounts RENAME COLUMN provider_subject TO provider_account_id;
    ALTER TABLE auth_accounts ADD COLUMN password_hash TEXT;

    ALTER TABLE auth_accounts
      DROP CONSTRAINT IF EXISTS auth_identities_provider_check,
      DROP CONSTRAINT IF EXISTS auth_identities_provider_provider_subject_key;

    ALTER TABLE auth_accounts
      ADD CONSTRAINT auth_accounts_provider_check
        CHECK (provider IN ('local', 'google', 'facebook')),
      ADD CONSTRAINT auth_accounts_provider_account_unique
        UNIQUE (provider, provider_account_id),
      ADD CONSTRAINT auth_accounts_password_hash_check
        CHECK (
          (provider = 'local' AND password_hash IS NOT NULL)
          OR (provider <> 'local' AND password_hash IS NULL)
        ),
      ADD CONSTRAINT auth_accounts_user_provider_unique
        UNIQUE (user_id, provider);

    INSERT INTO auth_accounts
      (user_id, provider, provider_account_id, password_hash)
    SELECT id, 'local', LOWER(email), password_hash
    FROM users
    WHERE password_hash IS NOT NULL;

    ALTER TABLE users DROP COLUMN password_hash;

    ALTER INDEX auth_identities_user_id_idx
      RENAME TO auth_accounts_user_id_idx;
  `);
}

export function down(pgm) {
  pgm.sql(`
    ALTER TABLE users ADD COLUMN password_hash TEXT;

    UPDATE users u
    SET password_hash = aa.password_hash
    FROM auth_accounts aa
    WHERE aa.user_id = u.id AND aa.provider = 'local';

    ALTER TABLE auth_accounts
      DROP CONSTRAINT IF EXISTS auth_accounts_user_provider_unique,
      DROP CONSTRAINT IF EXISTS auth_accounts_password_hash_check,
      DROP CONSTRAINT IF EXISTS auth_accounts_provider_account_unique,
      DROP CONSTRAINT IF EXISTS auth_accounts_provider_check;

    DELETE FROM auth_accounts WHERE provider = 'local';

    ALTER INDEX auth_accounts_user_id_idx
      RENAME TO auth_identities_user_id_idx;
    ALTER TABLE auth_accounts RENAME COLUMN provider_account_id TO provider_subject;
    ALTER TABLE auth_accounts RENAME TO auth_identities;
    ALTER TABLE auth_identities DROP COLUMN password_hash;

    ALTER TABLE auth_identities
      ADD CONSTRAINT auth_identities_provider_check
        CHECK (provider IN ('google', 'facebook')),
      ADD CONSTRAINT auth_identities_provider_provider_subject_key
        UNIQUE (provider, provider_subject);
  `);
}
