import { query } from '../../db/query.js';

export function createAuthRepository(database = { query }) {
  return {
    async findUserByEmail(email) {
      const result = await database.query(
        `SELECT u.id, u.email, u.email_verified_at,
                local_account.password_hash
         FROM users u
         LEFT JOIN auth_accounts local_account
           ON local_account.user_id = u.id
          AND local_account.provider = 'local'
         WHERE u.email = $1`,
        [email],
      );
      return result.rows[0] ?? null;
    },

    async findUserById(userId) {
      const result = await database.query(
        `SELECT u.id, u.email, u.email_verified_at,
                local_account.password_hash
         FROM users u
         LEFT JOIN auth_accounts local_account
           ON local_account.user_id = u.id
          AND local_account.provider = 'local'
         WHERE u.id = $1`,
        [userId],
      );
      return result.rows[0] ?? null;
    },

    async createUser(client, email, emailVerifiedAt = null) {
      const result = await client.query(
        `INSERT INTO users (email, email_verified_at)
         VALUES ($1, $2)
         RETURNING id, email, email_verified_at`,
        [email, emailVerifiedAt],
      );
      return result.rows[0];
    },

    async createAuthAccount(
      client,
      { userId, provider, providerAccountId, passwordHash = null },
    ) {
      const result = await client.query(
        `INSERT INTO auth_accounts
           (user_id, provider, provider_account_id, password_hash)
         VALUES ($1, $2, $3, $4)
         RETURNING id, user_id, provider, provider_account_id`,
        [userId, provider, providerAccountId, passwordHash],
      );
      return result.rows[0];
    },

    async invalidateVerificationTokens(client, userId) {
      await client.query(
        `UPDATE email_verification_tokens
         SET consumed_at = COALESCE(consumed_at, NOW())
         WHERE user_id = $1 AND consumed_at IS NULL`,
        [userId],
      );
    },

    async createEmailVerificationToken(
      client,
      { userId, tokenHash, expiresAt },
    ) {
      const result = await client.query(
        `INSERT INTO email_verification_tokens (user_id, token_hash, expires_at)
         VALUES ($1, $2, $3)
         RETURNING id, user_id, expires_at`,
        [userId, tokenHash, expiresAt],
      );
      return result.rows[0];
    },

    async findEmailVerificationToken(tokenHash) {
      const result = await database.query(
        `SELECT t.id, t.user_id, t.expires_at, t.consumed_at,
                u.email, u.email_verified_at
         FROM email_verification_tokens t
         JOIN users u ON u.id = t.user_id
         WHERE t.token_hash = $1`,
        [tokenHash],
      );
      return result.rows[0] ?? null;
    },

    async consumeEmailVerificationToken(client, tokenHash, userId) {
      const result = await client.query(
        `UPDATE email_verification_tokens
         SET consumed_at = NOW()
         WHERE token_hash = $1
           AND user_id = $2
           AND consumed_at IS NULL
           AND expires_at > NOW()
         RETURNING id`,
        [tokenHash, userId],
      );
      return result.rowCount === 1;
    },

    async markEmailVerified(client, userId) {
      const result = await client.query(
        `UPDATE users
         SET email_verified_at = COALESCE(email_verified_at, NOW()),
             updated_at = NOW()
         WHERE id = $1
         RETURNING id, email, email_verified_at`,
        [userId],
      );
      return result.rows[0] ?? null;
    },

    async invalidatePasswordResetTokens(client, userId) {
      await client.query(
        `UPDATE password_reset_tokens
         SET consumed_at = COALESCE(consumed_at, NOW())
         WHERE user_id = $1 AND consumed_at IS NULL`,
        [userId],
      );
    },

    async createPasswordResetToken(client, { userId, tokenHash, expiresAt }) {
      const result = await client.query(
        `INSERT INTO password_reset_tokens (user_id, token_hash, expires_at)
         VALUES ($1, $2, $3)
         RETURNING id, user_id, expires_at`,
        [userId, tokenHash, expiresAt],
      );
      return result.rows[0];
    },

    async findPasswordResetToken(tokenHash) {
      const result = await database.query(
        `SELECT t.id, t.user_id, t.expires_at, t.consumed_at,
                t.attempt_count, u.email, u.email_verified_at,
                local_account.password_hash
         FROM password_reset_tokens t
         JOIN users u ON u.id = t.user_id
         JOIN auth_accounts local_account
           ON local_account.user_id = u.id
          AND local_account.provider = 'local'
         WHERE t.token_hash = $1`,
        [tokenHash],
      );
      return result.rows[0] ?? null;
    },

    async consumePasswordResetToken(client, tokenHash, userId, maxAttempts) {
      const result = await client.query(
        `UPDATE password_reset_tokens
         SET consumed_at = NOW(), attempt_count = attempt_count + 1
         WHERE token_hash = $1
           AND user_id = $2
           AND consumed_at IS NULL
           AND expires_at > NOW()
           AND attempt_count < $3
         RETURNING id`,
        [tokenHash, userId, maxAttempts],
      );
      return result.rowCount === 1;
    },

    async updatePasswordHash(client, userId, passwordHash) {
      const result = await client.query(
        `UPDATE auth_accounts
         SET password_hash = $2, updated_at = NOW()
         WHERE user_id = $1 AND provider = 'local'
         RETURNING user_id`,
        [userId, passwordHash],
      );
      if (result.rowCount !== 1) return null;
      const user = await client.query(
        `SELECT id, email, email_verified_at
         FROM users
         WHERE id = $1`,
        [userId],
      );
      return user.rows[0] ?? null;
    },

    async revokeAllSessions(client, userId) {
      await client.query(
        `UPDATE sessions
         SET revoked_at = COALESCE(revoked_at, NOW())
         WHERE user_id = $1 AND revoked_at IS NULL`,
        [userId],
      );
    },

    async createAuthCallbackState(
      client,
      {
        stateHash,
        provider,
        purpose,
        sessionId,
        browserBindingHash,
        expiresAt,
      },
    ) {
      const result = await client.query(
        `INSERT INTO auth_callback_states
           (state_hash, provider, purpose, session_id, browser_binding_hash, expires_at)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id, provider, purpose, session_id, expires_at`,
        [
          stateHash,
          provider,
          purpose,
          sessionId,
          browserBindingHash,
          expiresAt,
        ],
      );
      return result.rows[0];
    },

    async consumeAuthCallbackState(
      client,
      { stateHash, provider, purpose, browserBindingHash, sessionId },
    ) {
      const result = await client.query(
        `UPDATE auth_callback_states
         SET consumed_at = NOW()
         WHERE state_hash = $1
           AND provider = $2
           AND purpose = $3
           AND browser_binding_hash = $4
           AND consumed_at IS NULL
           AND expires_at > NOW()
           AND session_id IS NOT DISTINCT FROM $5
         RETURNING id, session_id`,
        [stateHash, provider, purpose, browserBindingHash, sessionId],
      );
      return result.rows[0] ?? null;
    },

    async findAuthCallbackState({ stateHash, provider, browserBindingHash }) {
      const result = await database.query(
        `SELECT id, provider, purpose, session_id, expires_at
         FROM auth_callback_states
         WHERE state_hash = $1
           AND provider = $2
           AND browser_binding_hash = $3
           AND consumed_at IS NULL
           AND expires_at > NOW()`,
        [stateHash, provider, browserBindingHash],
      );
      return result.rows[0] ?? null;
    },

    async findAuthAccount(provider, providerAccountId) {
      const result = await database.query(
        `SELECT aa.id, aa.user_id, aa.provider, aa.provider_account_id,
                u.email, u.email_verified_at,
                local_account.password_hash
         FROM auth_accounts aa
         JOIN users u ON u.id = aa.user_id
         LEFT JOIN auth_accounts local_account
           ON local_account.user_id = aa.user_id
          AND local_account.provider = 'local'
         WHERE aa.provider = $1 AND aa.provider_account_id = $2`,
        [provider, providerAccountId],
      );
      return result.rows[0] ?? null;
    },

    async listAuthAccounts(userId) {
      const result = await database.query(
        `SELECT provider, created_at
         FROM auth_accounts
         WHERE user_id = $1
         ORDER BY provider`,
        [userId],
      );
      return result.rows;
    },

    async deleteAuthAccount(client, userId, provider) {
      const result = await client.query(
        `DELETE FROM auth_accounts
         WHERE user_id = $1 AND provider = $2
         RETURNING provider`,
        [userId, provider],
      );
      return result.rowCount === 1;
    },

    async createExternalUser(client, email) {
      const result = await client.query(
        `INSERT INTO users (email, email_verified_at)
         VALUES ($1, NOW())
         RETURNING id, email, email_verified_at`,
        [email],
      );
      return result.rows[0];
    },

    async createSession(client, { userId, tokenHash, expiresAt }) {
      const result = await client.query(
        `INSERT INTO sessions (user_id, token_hash, expires_at)
         VALUES ($1, $2, $3)
         RETURNING id, user_id, created_at, expires_at`,
        [userId, tokenHash, expiresAt],
      );
      return result.rows[0];
    },

    async findSession(tokenHash) {
      const result = await database.query(
        `SELECT s.id, s.user_id, s.created_at, s.expires_at, s.revoked_at,
                 u.email, u.email_verified_at
         FROM sessions s
         JOIN users u ON u.id = s.user_id
         WHERE s.token_hash = $1`,
        [tokenHash],
      );
      return result.rows[0] ?? null;
    },

    async touchSession(sessionId, expiresAt) {
      await database.query(
        `UPDATE sessions
         SET last_used_at = NOW(), expires_at = $2
         WHERE id = $1 AND revoked_at IS NULL`,
        [sessionId, expiresAt],
      );
    },

    async revokeSession(tokenHash) {
      await database.query(
        `UPDATE sessions
         SET revoked_at = COALESCE(revoked_at, NOW())
         WHERE token_hash = $1`,
        [tokenHash],
      );
    },
  };
}
