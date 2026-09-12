import argon2 from 'argon2';
import { randomUUID } from 'node:crypto';
import { pool } from './pool.js';

const email = process.env.SEED_EMAIL ?? 'dev@example.test';
const password = process.env.SEED_PASSWORD;

if (!password) {
  throw new Error('SEED_PASSWORD is required to seed development data.');
}

const passwordHash = await argon2.hash(password);
const client = await pool.getConnection();

try {
  await client.query('BEGIN');

  const normalizedEmail = email.trim().toLowerCase();

  const existingUser = await client.query(
    'SELECT id FROM users WHERE email = ?',
    [normalizedEmail],
  );
  let userId = existingUser.rows[0]?.id;
  if (userId) {
    await client.query('UPDATE users SET updated_at = NOW() WHERE id = ?', [
      userId,
    ]);
  } else {
    userId = randomUUID();
    await client.query('INSERT INTO users (id, email) VALUES (?, ?)', [
      userId,
      normalizedEmail,
    ]);
  }

  const existingAccount = await client.query(
    `SELECT id FROM auth_accounts
     WHERE provider = 'local' AND provider_account_id = ?`,
    [normalizedEmail],
  );
  if (existingAccount.rows[0]) {
    await client.query(
      'UPDATE auth_accounts SET password_hash = ?, updated_at = NOW() WHERE id = ?',
      [passwordHash, existingAccount.rows[0].id],
    );
  } else {
    await client.query(
      `INSERT INTO auth_accounts
         (id, user_id, provider, provider_account_id, password_hash)
       VALUES (?, ?, 'local', ?, ?)`,
      [randomUUID(), userId, normalizedEmail, passwordHash],
    );
  }

  const existingNotebook = await client.query(
    'SELECT id FROM notebooks WHERE user_id = ? AND normalized_name = ?',
    [userId, 'personal'],
  );
  let notebookId = existingNotebook.rows[0]?.id;
  if (notebookId) {
    await client.query('UPDATE notebooks SET name = ? WHERE id = ?', [
      'Personal',
      notebookId,
    ]);
  } else {
    notebookId = randomUUID();
    await client.query(
      'INSERT INTO notebooks (id, user_id, name, normalized_name) VALUES (?, ?, ?, ?)',
      [notebookId, userId, 'Personal', 'personal'],
    );
  }

  const existingTag = await client.query(
    'SELECT id FROM tags WHERE user_id = ? AND normalized_name = ?',
    [userId, 'getting started'],
  );
  let tagId = existingTag.rows[0]?.id;
  if (tagId) {
    await client.query('UPDATE tags SET name = ? WHERE id = ?', [
      'Getting Started',
      tagId,
    ]);
  } else {
    tagId = randomUUID();
    await client.query(
      'INSERT INTO tags (id, user_id, name, normalized_name) VALUES (?, ?, ?, ?)',
      [tagId, userId, 'Getting Started', 'getting started'],
    );
  }

  const noteId = randomUUID();
  await client.query(
    `INSERT INTO notes (
       id, user_id, notebook_id, title, searchable_text,
       search_title, search_content, search_tags
     )
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      noteId,
      userId,
      notebookId,
      'Welcome to Note App',
      'Welcome to Note App',
      'Welcome to Note App',
      'Welcome to Note App',
      'Getting Started',
    ],
  );

  await client.query(
    'INSERT IGNORE INTO note_tags (note_id, tag_id) VALUES (?, ?)',
    [noteId, tagId],
  );

  await client.query('COMMIT');
} catch (error) {
  await client.query('ROLLBACK');
  throw error;
} finally {
  client.release();
  await pool.end();
}
