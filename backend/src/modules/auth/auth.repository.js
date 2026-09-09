import { query } from '../../db/query.js';

export function createAuthRepository(database = { query }) {
  return {
    async findUserByEmail(email) {
      const result = await database.query(
        `SELECT id, email, password_hash
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
         RETURNING id, email`,
        [email, passwordHash],
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
                u.email
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
