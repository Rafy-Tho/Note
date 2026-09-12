export const up = [
  'ALTER TABLE auth_identities RENAME TO auth_accounts',
  'ALTER TABLE auth_accounts RENAME COLUMN provider_subject TO provider_account_id',
  'ALTER TABLE auth_accounts ADD COLUMN password_hash VARCHAR(255) NULL',
  'ALTER TABLE auth_accounts DROP CONSTRAINT auth_identities_provider_check',
  'ALTER TABLE auth_accounts DROP INDEX auth_identities_provider_provider_subject_key',

  `ALTER TABLE auth_accounts
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
       UNIQUE (user_id, provider)`,

  `INSERT INTO auth_accounts
     (id, user_id, provider, provider_account_id, password_hash)
   SELECT UUID(), id, 'local', LOWER(email), password_hash
   FROM users
   WHERE password_hash IS NOT NULL`,

  'ALTER TABLE users DROP COLUMN password_hash',
  'ALTER TABLE auth_accounts RENAME INDEX auth_identities_user_id_idx TO auth_accounts_user_id_idx',
];

export const down = [
  'ALTER TABLE users ADD COLUMN password_hash VARCHAR(255) NULL',

  `UPDATE users
   INNER JOIN auth_accounts
     ON auth_accounts.user_id = users.id AND auth_accounts.provider = 'local'
   SET users.password_hash = auth_accounts.password_hash`,

  'ALTER TABLE auth_accounts DROP INDEX auth_accounts_user_provider_unique',
  'ALTER TABLE auth_accounts DROP CONSTRAINT auth_accounts_password_hash_check',
  'ALTER TABLE auth_accounts DROP INDEX auth_accounts_provider_account_unique',
  'ALTER TABLE auth_accounts DROP CONSTRAINT auth_accounts_provider_check',
  "DELETE FROM auth_accounts WHERE provider = 'local'",
  'ALTER TABLE auth_accounts RENAME INDEX auth_accounts_user_id_idx TO auth_identities_user_id_idx',
  'ALTER TABLE auth_accounts RENAME COLUMN provider_account_id TO provider_subject',
  'ALTER TABLE auth_accounts RENAME TO auth_identities',
  'ALTER TABLE auth_identities DROP COLUMN password_hash',

  `ALTER TABLE auth_identities
     ADD CONSTRAINT auth_identities_provider_check
       CHECK (provider IN ('google', 'facebook')),
     ADD CONSTRAINT auth_identities_provider_provider_subject_key
       UNIQUE (provider, provider_subject)`,
];
