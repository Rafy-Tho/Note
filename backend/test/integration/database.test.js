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
});
