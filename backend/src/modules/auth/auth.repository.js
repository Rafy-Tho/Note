import { query } from '../../db/query.js';

export function createAuthRepository(database = { query }) {
  return {
    async findUserByEmail(email) {
      const result = await database.query(
        `SELECT id, email, password_hash, email_verified_at
         FROM users
         WHERE email = $1`,
        [email],
      );
      return result.rows[0] ?? null;
    },

    async createUser(client, email, passwordHash) {
      const result = await client.query(
        `INSERT INTO users (email, password_hash)
         VALUES ($1, $2)
         RETURNING id, email, email_verified_at`,
        [email, passwordHash],
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
                u.password_hash
         FROM password_reset_tokens t
         JOIN users u ON u.id = t.user_id
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
        `UPDATE users
         SET password_hash = $2, updated_at = NOW()
         WHERE id = $1
         RETURNING id, email, email_verified_at`,
        [userId, passwordHash],
      );
      return result.rows[0] ?? null;
    },

    async revokeAllSessions(client, userId) {
      await client.query(
        `UPDATE sessions
         SET revoked_at = COALESCE(revoked_at, NOW())
         WHERE user_id = $1 AND revoked_at IS NULL`,
        [userId],
      );
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
