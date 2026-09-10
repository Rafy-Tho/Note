import pg from 'pg';
import { describe, expect, it } from 'vitest';

const databaseUrl = process.env.DATABASE_URL;
const databaseTest = databaseUrl ? describe : describe.skip;

databaseTest('database foundation', () => {
  it('enforces ownership-related uniqueness and relationship constraints', async () => {
    const pool = new pg.Pool({ connectionString: databaseUrl });
    const client = await pool.connect();

    try {
      const user = await client.query(
        `INSERT INTO users (email, password_hash)
         VALUES ('database-test@example.test', 'test-hash')
         RETURNING id`,
      );
      const userId = user.rows[0].id;

      await client.query(
        `INSERT INTO notebooks (user_id, name, normalized_name)
         VALUES ($1, 'Work', 'work')`,
        [userId],
      );

      await expect(
        client.query(
          `INSERT INTO notebooks (user_id, name, normalized_name)
           VALUES ($1, 'Work Again', 'work')`,
          [userId],
        ),
      ).rejects.toMatchObject({ code: '23505' });
    } finally {
      await client.query('DELETE FROM users WHERE email = $1', [
        'database-test@example.test',
      ]);
      client.release();
      await pool.end();
    }
  });

  it('supports authentication expansion records and callback-state rules', async () => {
    const pool = new pg.Pool({ connectionString: databaseUrl });
    const client = await pool.connect();
    const email = `auth-expansion-${Date.now()}@example.test`;

    try {
      const user = await client.query(
        `INSERT INTO users (email, password_hash)
         VALUES ($1, NULL)
         RETURNING id`,
        [email],
      );
      const userId = user.rows[0].id;

      const identity = await client.query(
        `INSERT INTO auth_identities (user_id, provider, provider_subject)
         VALUES ($1, 'google', 'database-test-subject')
         RETURNING id`,
        [userId],
      );
      expect(identity.rows[0].id).toBeTruthy();

      await expect(
        client.query(
          `INSERT INTO auth_callback_states
             (state_hash, provider, purpose, browser_binding_hash, expires_at)
           VALUES (
             'state-without-link-session', 'google', 'link', 'browser',
             NOW() + INTERVAL '5 minutes'
           )`,
        ),
      ).rejects.toMatchObject({ code: '23514' });

      await client.query(
        `INSERT INTO email_verification_tokens (user_id, token_hash, expires_at)
         VALUES ($1, 'verification-token-hash', NOW() + INTERVAL '1 hour')`,
        [userId],
      );
      await client.query(
        `INSERT INTO password_reset_tokens (user_id, token_hash, expires_at)
         VALUES ($1, 'reset-token-hash', NOW() + INTERVAL '1 hour')`,
        [userId],
      );
    } finally {
      await client.query('DELETE FROM users WHERE email = $1', [email]);
      client.release();
      await pool.end();
    }
  });
});
