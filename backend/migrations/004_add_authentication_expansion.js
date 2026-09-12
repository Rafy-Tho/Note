export const up = [
  `ALTER TABLE users
     MODIFY COLUMN password_hash VARCHAR(255) NULL,
     ADD COLUMN email_verified_at DATETIME(3) NULL`,

  `CREATE TABLE auth_identities (
     id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
     user_id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
     provider VARCHAR(20) NOT NULL,
     provider_subject VARCHAR(255) NOT NULL,
     created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
     updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
     PRIMARY KEY (id),
     UNIQUE KEY auth_identities_provider_provider_subject_key (provider, provider_subject),
     KEY auth_identities_user_id_idx (user_id),
     CONSTRAINT auth_identities_provider_check
       CHECK (provider IN ('google', 'facebook')),
     CONSTRAINT auth_identities_user_id_fk
       FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
   ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci`,

  `CREATE TABLE email_verification_tokens (
     id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
     user_id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
     token_hash VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
     expires_at DATETIME(3) NOT NULL,
     consumed_at DATETIME(3) NULL,
     created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
     PRIMARY KEY (id),
     UNIQUE KEY email_verification_tokens_token_hash_unique (token_hash),
     KEY email_verification_tokens_user_expiry_idx (user_id, expires_at),
     CONSTRAINT email_verification_tokens_user_id_fk
       FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
   ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci`,

  `CREATE TABLE password_reset_tokens (
     id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
     user_id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
     token_hash VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
     expires_at DATETIME(3) NOT NULL,
     consumed_at DATETIME(3) NULL,
     attempt_count INT NOT NULL DEFAULT 0,
     created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
     PRIMARY KEY (id),
     UNIQUE KEY password_reset_tokens_token_hash_unique (token_hash),
     KEY password_reset_tokens_user_expiry_idx (user_id, expires_at),
     CONSTRAINT password_reset_tokens_attempt_count_check
       CHECK (attempt_count >= 0),
     CONSTRAINT password_reset_tokens_user_id_fk
       FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
   ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci`,

  `CREATE TABLE auth_callback_states (
     id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
     state_hash VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
     provider VARCHAR(20) NOT NULL,
     purpose VARCHAR(20) NOT NULL,
     session_id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NULL,
     browser_binding_hash VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
     expires_at DATETIME(3) NOT NULL,
     consumed_at DATETIME(3) NULL,
     created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
     PRIMARY KEY (id),
     UNIQUE KEY auth_callback_states_state_hash_unique (state_hash),
     KEY auth_callback_states_expiry_idx (expires_at, consumed_at),
     KEY auth_callback_states_session_id_idx (session_id),
     CONSTRAINT auth_callback_states_provider_check
       CHECK (provider IN ('google', 'facebook')),
     CONSTRAINT auth_callback_states_purpose_check
       CHECK (purpose IN ('sign_in', 'link')),
     CONSTRAINT auth_callback_states_session_required_check
       CHECK (purpose = 'sign_in' OR session_id IS NOT NULL),
     CONSTRAINT auth_callback_states_session_id_fk
       FOREIGN KEY (session_id) REFERENCES sessions (id) ON DELETE CASCADE
   ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci`,
];

export const down = [
  'DROP TABLE IF EXISTS auth_callback_states',
  'DROP TABLE IF EXISTS password_reset_tokens',
  'DROP TABLE IF EXISTS email_verification_tokens',
  'DROP TABLE IF EXISTS auth_identities',
  `ALTER TABLE users
     DROP COLUMN email_verified_at,
     MODIFY COLUMN password_hash VARCHAR(255) NOT NULL`,
];
