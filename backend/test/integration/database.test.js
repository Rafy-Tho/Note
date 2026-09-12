import mysql from 'mysql2/promise';
import { randomUUID } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { createAuthRepository } from '../../src/modules/auth/auth.repository.js';

const databaseUrl = process.env.DATABASE_URL;
const databaseTest = databaseUrl ? describe : describe.skip;

function createPool() {
  return mysql.createPool({ uri: databaseUrl, timezone: 'Z' });
}

function normalize(result) {
  if (Array.isArray(result)) return { rows: result, rowCount: result.length };
  return { rows: [], rowCount: result.affectedRows ?? 0 };
}

async function connect(pool) {
  const connection = await pool.getConnection();
  return {
    query: async (text, values) => {
      const [result] = await connection.query(text, values);
      return normalize(result);
    },
    release: () => connection.release(),
  };
}

async function expectCheckConstraintViolation(promise) {
  const error = await promise.then(
    () => null,
    (caught) => caught,
  );
  expect(error).not.toBeNull();
  expect([3819, 4025]).toContain(error.errno);
}

databaseTest('database foundation', () => {
  it('enforces ownership-related uniqueness and relationship constraints', async () => {
    const pool = createPool();
    const client = await connect(pool);

    try {
      const userId = randomUUID();
      await client.query('INSERT INTO users (id, email) VALUES (?, ?)', [
        userId,
        'database-test@example.test',
      ]);

      await client.query(
        `INSERT INTO notebooks (id, user_id, name, normalized_name)
         VALUES (?, ?, 'Work', 'work')`,
        [randomUUID(), userId],
      );

      await expect(
        client.query(
          `INSERT INTO notebooks (id, user_id, name, normalized_name)
           VALUES (?, ?, 'Work Again', 'work')`,
          [randomUUID(), userId],
        ),
      ).rejects.toMatchObject({ errno: 1062 });
    } finally {
      await client.query('DELETE FROM users WHERE email = ?', [
        'database-test@example.test',
      ]);
      client.release();
      await pool.end();
    }
  });

  it('supports authentication expansion records and callback-state rules', async () => {
    const pool = createPool();
    const client = await connect(pool);
    const email = `auth-expansion-${Date.now()}@example.test`;
    const authRepository = createAuthRepository({
      query: (...args) => client.query(...args),
    });

    try {
      const userPasswordColumn = await client.query(
        `SELECT 1
         FROM information_schema.columns
         WHERE table_schema = DATABASE()
           AND table_name = 'users' AND column_name = 'password_hash'`,
      );
      expect(userPasswordColumn.rowCount).toBe(0);

      const userId = randomUUID();
      await client.query('INSERT INTO users (id, email) VALUES (?, ?)', [
        userId,
        email,
      ]);

      const accountId = randomUUID();
      await client.query(
        `INSERT INTO auth_accounts (id, user_id, provider, provider_account_id)
         VALUES (?, ?, 'google', 'database-test-subject')`,
        [accountId, userId],
      );
      expect(accountId).toBeTruthy();

      await expect(
        client.query(
          `INSERT INTO auth_accounts (id, user_id, provider, provider_account_id)
           VALUES (?, ?, 'google', 'database-test-subject')`,
          [randomUUID(), userId],
        ),
      ).rejects.toMatchObject({ errno: 1062 });

      await expectCheckConstraintViolation(
        client.query(
          `INSERT INTO auth_accounts
             (id, user_id, provider, provider_account_id, password_hash)
           VALUES (?, ?, 'google', 'google-with-password', 'invalid')`,
          [randomUUID(), userId],
        ),
      );

      const localId = randomUUID();
      await client.query(
        `INSERT INTO auth_accounts
           (id, user_id, provider, provider_account_id, password_hash)
         VALUES (?, ?, 'local', ?, 'test-hash')`,
        [localId, userId, email],
      );
      expect(localId).toBeTruthy();

      await expect(
        authRepository.findUserByEmail(email),
      ).resolves.toMatchObject({
        id: userId,
        email,
        password_hash: 'test-hash',
      });
      await expect(
        authRepository.findAuthAccount('google', 'database-test-subject'),
      ).resolves.toMatchObject({ user_id: userId, provider: 'google' });

      await expect(
        authRepository.updatePasswordHash(client, userId, 'updated-hash'),
      ).resolves.toMatchObject({ id: userId, email });
      await expect(
        authRepository.findUserByEmail(email),
      ).resolves.toMatchObject({ password_hash: 'updated-hash' });

      await expectCheckConstraintViolation(
        client.query(
          `INSERT INTO auth_callback_states
             (id, state_hash, provider, purpose, browser_binding_hash, expires_at)
           VALUES (
             ?, 'state-without-link-session', 'google', 'link', 'browser',
             NOW() + INTERVAL 5 MINUTE
           )`,
          [randomUUID()],
        ),
      );

      await client.query(
        `INSERT INTO email_verification_tokens (id, user_id, token_hash, expires_at)
         VALUES (?, ?, 'verification-token-hash', NOW() + INTERVAL 1 HOUR)`,
        [randomUUID(), userId],
      );
      await client.query(
        `INSERT INTO password_reset_tokens (id, user_id, token_hash, expires_at)
         VALUES (?, ?, 'reset-token-hash', NOW() + INTERVAL 1 HOUR)`,
        [randomUUID(), userId],
      );
    } finally {
      await client.query('DELETE FROM users WHERE email = ?', [email]);
      client.release();
      await pool.end();
    }
  });
});
