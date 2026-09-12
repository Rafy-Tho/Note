import { randomUUID } from 'node:crypto';
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
         WHERE u.email = ?`,
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
         WHERE u.id = ?`,
        [userId],
      );
      return result.rows[0] ?? null;
    },

    async createUser(client, email, emailVerifiedAt = null) {
      const userId = randomUUID();
      await client.query(
        `INSERT INTO users (id, email, email_verified_at)
         VALUES (?, ?, ?)`,
        [userId, email, emailVerifiedAt],
      );
      return { id: userId, email, email_verified_at: emailVerifiedAt };
    },

    async createAuthAccount(
      client,
      { userId, provider, providerAccountId, passwordHash = null },
    ) {
      const accountId = randomUUID();
      await client.query(
        `INSERT INTO auth_accounts
           (id, user_id, provider, provider_account_id, password_hash)
         VALUES (?, ?, ?, ?, ?)`,
        [accountId, userId, provider, providerAccountId, passwordHash],
      );
      return {
        id: accountId,
        user_id: userId,
        provider,
        provider_account_id: providerAccountId,
      };
    },

    async invalidateVerificationTokens(client, userId) {
      await client.query(
        `UPDATE email_verification_tokens
         SET consumed_at = COALESCE(consumed_at, NOW())
         WHERE user_id = ? AND consumed_at IS NULL`,
        [userId],
      );
    },

    async createEmailVerificationToken(
      client,
      { userId, tokenHash, expiresAt },
    ) {
      const tokenId = randomUUID();
      await client.query(
        `INSERT INTO email_verification_tokens (id, user_id, token_hash, expires_at)
         VALUES (?, ?, ?, ?)`,
        [tokenId, userId, tokenHash, expiresAt],
      );
      return { id: tokenId, user_id: userId, expires_at: expiresAt };
    },

    async findEmailVerificationToken(tokenHash) {
      const result = await database.query(
        `SELECT t.id, t.user_id, t.expires_at, t.consumed_at,
                u.email, u.email_verified_at
         FROM email_verification_tokens t
         JOIN users u ON u.id = t.user_id
         WHERE t.token_hash = ?`,
        [tokenHash],
      );
      return result.rows[0] ?? null;
    },

    async consumeEmailVerificationToken(client, tokenHash, userId) {
      const result = await client.query(
        `UPDATE email_verification_tokens
         SET consumed_at = NOW()
         WHERE token_hash = ?
           AND user_id = ?
           AND consumed_at IS NULL
           AND expires_at > NOW()`,
        [tokenHash, userId],
      );
      return result.rowCount === 1;
    },

    async markEmailVerified(client, userId) {
      const result = await client.query(
        `UPDATE users
         SET email_verified_at = COALESCE(email_verified_at, NOW()),
             updated_at = NOW()
         WHERE id = ?`,
        [userId],
      );
      if (result.rowCount !== 1) return null;
      const user = await client.query(
        `SELECT id, email, email_verified_at FROM users WHERE id = ?`,
        [userId],
      );
      return user.rows[0] ?? null;
    },

    async invalidatePasswordResetTokens(client, userId) {
      await client.query(
        `UPDATE password_reset_tokens
         SET consumed_at = COALESCE(consumed_at, NOW())
         WHERE user_id = ? AND consumed_at IS NULL`,
        [userId],
      );
    },

    async createPasswordResetToken(client, { userId, tokenHash, expiresAt }) {
      const tokenId = randomUUID();
      await client.query(
        `INSERT INTO password_reset_tokens (id, user_id, token_hash, expires_at)
         VALUES (?, ?, ?, ?)`,
        [tokenId, userId, tokenHash, expiresAt],
      );
      return { id: tokenId, user_id: userId, expires_at: expiresAt };
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
         WHERE t.token_hash = ?`,
        [tokenHash],
      );
      return result.rows[0] ?? null;
    },

    async consumePasswordResetToken(client, tokenHash, userId, maxAttempts) {
      const result = await client.query(
        `UPDATE password_reset_tokens
         SET consumed_at = NOW(), attempt_count = attempt_count + 1
         WHERE token_hash = ?
           AND user_id = ?
           AND consumed_at IS NULL
           AND expires_at > NOW()
           AND attempt_count < ?`,
        [tokenHash, userId, maxAttempts],
      );
      return result.rowCount === 1;
    },

    async updatePasswordHash(client, userId, passwordHash) {
      const result = await client.query(
        `UPDATE auth_accounts
         SET password_hash = ?, updated_at = NOW()
         WHERE user_id = ? AND provider = 'local'`,
        [passwordHash, userId],
      );
      if (result.rowCount !== 1) return null;
      const user = await client.query(
        `SELECT id, email, email_verified_at
         FROM users
         WHERE id = ?`,
        [userId],
      );
      return user.rows[0] ?? null;
    },

    async revokeAllSessions(client, userId) {
      await client.query(
        `UPDATE sessions
         SET revoked_at = COALESCE(revoked_at, NOW())
         WHERE user_id = ? AND revoked_at IS NULL`,
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
      const stateId = randomUUID();
      await client.query(
        `INSERT INTO auth_callback_states
           (id, state_hash, provider, purpose, session_id, browser_binding_hash, expires_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          stateId,
          stateHash,
          provider,
          purpose,
          sessionId,
          browserBindingHash,
          expiresAt,
        ],
      );
      return {
        id: stateId,
        provider,
        purpose,
        session_id: sessionId,
        expires_at: expiresAt,
      };
    },

    async consumeAuthCallbackState(
      client,
      { stateHash, provider, purpose, browserBindingHash, sessionId },
    ) {
      const result = await client.query(
        `UPDATE auth_callback_states
         SET consumed_at = NOW()
         WHERE state_hash = ?
           AND provider = ?
           AND purpose = ?
           AND browser_binding_hash = ?
           AND consumed_at IS NULL
           AND expires_at > NOW()
           AND session_id <=> ?`,
        [stateHash, provider, purpose, browserBindingHash, sessionId],
      );
      if (result.rowCount !== 1) return null;
      return { id: null, session_id: sessionId ?? null };
    },

    async findAuthCallbackState({ stateHash, provider, browserBindingHash }) {
      const result = await database.query(
        `SELECT id, provider, purpose, session_id, expires_at
         FROM auth_callback_states
         WHERE state_hash = ?
           AND provider = ?
           AND browser_binding_hash = ?
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
         WHERE aa.provider = ? AND aa.provider_account_id = ?`,
        [provider, providerAccountId],
      );
      return result.rows[0] ?? null;
    },

    async listAuthAccounts(userId) {
      const result = await database.query(
        `SELECT provider, created_at
         FROM auth_accounts
         WHERE user_id = ?
         ORDER BY provider`,
        [userId],
      );
      return result.rows;
    },

    async deleteAuthAccount(client, userId, provider) {
      const result = await client.query(
        `DELETE FROM auth_accounts
         WHERE user_id = ? AND provider = ?`,
        [userId, provider],
      );
      return result.rowCount === 1;
    },

    async createExternalUser(client, email) {
      const userId = randomUUID();
      await client.query(
        `INSERT INTO users (id, email, email_verified_at)
         VALUES (?, ?, NOW())`,
        [userId, email],
      );
      const user = await client.query(
        `SELECT id, email, email_verified_at FROM users WHERE id = ?`,
        [userId],
      );
      return user.rows[0];
    },

    async createSession(client, { userId, tokenHash, expiresAt }) {
      const sessionId = randomUUID();
      await client.query(
        `INSERT INTO sessions (id, user_id, token_hash, expires_at)
         VALUES (?, ?, ?, ?)`,
        [sessionId, userId, tokenHash, expiresAt],
      );
      const session = await client.query(
        `SELECT id, user_id, created_at, expires_at FROM sessions WHERE id = ?`,
        [sessionId],
      );
      return session.rows[0];
    },

    async findSession(tokenHash) {
      const result = await database.query(
        `SELECT s.id, s.user_id, s.created_at, s.expires_at, s.revoked_at,
                u.email, u.email_verified_at
         FROM sessions s
         JOIN users u ON u.id = s.user_id
         WHERE s.token_hash = ?`,
        [tokenHash],
      );
      return result.rows[0] ?? null;
    },

    async touchSession(sessionId, expiresAt) {
      await database.query(
        `UPDATE sessions
         SET last_used_at = NOW(), expires_at = ?
         WHERE id = ? AND revoked_at IS NULL`,
        [expiresAt, sessionId],
      );
    },

    async revokeSession(tokenHash) {
      await database.query(
        `UPDATE sessions
         SET revoked_at = COALESCE(revoked_at, NOW())
         WHERE token_hash = ?`,
        [tokenHash],
      );
    },
  };
}
