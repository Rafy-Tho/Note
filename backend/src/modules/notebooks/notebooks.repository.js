import { randomUUID } from 'node:crypto';
import { query } from '../../db/query.js';

const NOTEBOOK_COLUMNS =
  'id, user_id, name, normalized_name, created_at, updated_at';

function toNotebook(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function createNotebooksRepository(database = { query }) {
  async function findNotebookRow(connection, userId, notebookId) {
    const result = await connection.query(
      `SELECT ${NOTEBOOK_COLUMNS} FROM notebooks WHERE id = ? AND user_id = ?`,
      [notebookId, userId],
    );
    return result.rows[0] ?? null;
  }

  return {
    async list(userId, { page, limit }) {
      const values = [userId, limit, (page - 1) * limit];
      const count = await database.query(
        'SELECT COUNT(*) AS total FROM notebooks WHERE user_id = ?',
        [userId],
      );
      const result = await database.query(
        `SELECT ${NOTEBOOK_COLUMNS} FROM notebooks
         WHERE user_id = ? ORDER BY normalized_name, id LIMIT ? OFFSET ?`,
        values,
      );
      return {
        notebooks: result.rows.map(toNotebook),
        total: count.rows[0].total,
      };
    },

    async create(client, userId, { name, normalizedName }) {
      const notebookId = randomUUID();
      await client.query(
        `INSERT INTO notebooks (id, user_id, name, normalized_name)
         VALUES (?, ?, ?, ?)`,
        [notebookId, userId, name, normalizedName],
      );
      return toNotebook(await findNotebookRow(client, userId, notebookId));
    },

    async findById(client, userId, notebookId) {
      return findNotebookRow(client, userId, notebookId);
    },

    async rename(client, userId, notebookId, { name, normalizedName }) {
      const result = await client.query(
        `UPDATE notebooks SET name = ?, normalized_name = ?, updated_at = NOW()
         WHERE id = ? AND user_id = ?`,
        [name, normalizedName, notebookId, userId],
      );
      if (result.rowCount !== 1) return null;
      return toNotebook(await findNotebookRow(client, userId, notebookId));
    },

    async delete(client, userId, notebookId) {
      await client.query(
        'UPDATE notes SET notebook_id = NULL, updated_at = NOW() WHERE user_id = ? AND notebook_id = ?',
        [userId, notebookId],
      );
      const result = await client.query(
        'DELETE FROM notebooks WHERE id = ? AND user_id = ?',
        [notebookId, userId],
      );
      return result.rowCount === 1 ? { id: notebookId } : null;
    },
  };
}
