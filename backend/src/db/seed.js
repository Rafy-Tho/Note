import argon2 from 'argon2';
import { pool } from './pool.js';

const email = process.env.SEED_EMAIL ?? 'dev@example.test';
const password = process.env.SEED_PASSWORD;

if (!password) {
  throw new Error('SEED_PASSWORD is required to seed development data.');
}

const passwordHash = await argon2.hash(password);
const client = await pool.connect();

try {
  await client.query('BEGIN');

  const userResult = await client.query(
    `INSERT INTO users (email)
     VALUES ($1)
     ON CONFLICT (email) DO UPDATE SET updated_at = NOW()
     RETURNING id`,
    [email.trim().toLowerCase()],
  );
  const userId = userResult.rows[0].id;

  await client.query(
    `INSERT INTO auth_accounts
       (user_id, provider, provider_account_id, password_hash)
     VALUES ($1, 'local', $2, $3)
     ON CONFLICT (provider, provider_account_id)
     DO UPDATE SET password_hash = EXCLUDED.password_hash,
                   updated_at = NOW()`,
    [userId, email.trim().toLowerCase(), passwordHash],
  );

  const notebookResult = await client.query(
    `INSERT INTO notebooks (user_id, name, normalized_name)
     VALUES ($1, 'Personal', 'personal')
     ON CONFLICT (user_id, normalized_name) DO UPDATE SET name = EXCLUDED.name
     RETURNING id`,
    [userId],
  );
  const notebookId = notebookResult.rows[0].id;

  const tagResult = await client.query(
    `INSERT INTO tags (user_id, name, normalized_name)
     VALUES ($1, 'Getting Started', 'getting started')
     ON CONFLICT (user_id, normalized_name) DO UPDATE SET name = EXCLUDED.name
     RETURNING id`,
    [userId],
  );

  const noteResult = await client.query(
    `INSERT INTO notes (user_id, notebook_id, title, searchable_text)
     VALUES ($1, $2, 'Welcome to Note App', 'Welcome to Note App')
     RETURNING id`,
    [userId, notebookId],
  );

  await client.query(
    `INSERT INTO note_tags (note_id, tag_id)
     VALUES ($1, $2)
     ON CONFLICT DO NOTHING`,
    [noteResult.rows[0].id, tagResult.rows[0].id],
  );

  await client.query('COMMIT');
} catch (error) {
  await client.query('ROLLBACK');
  throw error;
} finally {
  client.release();
  await pool.end();
}
