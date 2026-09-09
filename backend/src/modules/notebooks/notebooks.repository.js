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
  return {
    async list(userId, { page, limit }) {
      const values = [userId, limit, (page - 1) * limit];
      const count = await database.query(
        'SELECT COUNT(*)::integer AS total FROM notebooks WHERE user_id = $1',
        [userId],
      );
      const result = await database.query(
        `SELECT ${NOTEBOOK_COLUMNS} FROM notebooks
         WHERE user_id = $1 ORDER BY normalized_name, id LIMIT $2 OFFSET $3`,
        values,
      );
      return {
        notebooks: result.rows.map(toNotebook),
        total: count.rows[0].total,
      };
    },

    async create(client, userId, { name, normalizedName }) {
      const result = await client.query(
        `INSERT INTO notebooks (user_id, name, normalized_name)
         VALUES ($1, $2, $3) RETURNING ${NOTEBOOK_COLUMNS}`,
        [userId, name, normalizedName],
      );
      return toNotebook(result.rows[0]);
    },

    async findById(client, userId, notebookId) {
      const result = await client.query(
        `SELECT ${NOTEBOOK_COLUMNS} FROM notebooks WHERE id = $1 AND user_id = $2`,
        [notebookId, userId],
      );
      return result.rows[0] ?? null;
    },

    async rename(client, userId, notebookId, { name, normalizedName }) {
      const result = await client.query(
        `UPDATE notebooks SET name = $3, normalized_name = $4, updated_at = NOW()
         WHERE id = $1 AND user_id = $2 RETURNING ${NOTEBOOK_COLUMNS}`,
        [notebookId, userId, name, normalizedName],
      );
      return toNotebook(result.rows[0]);
    },

    async delete(client, userId, notebookId) {
      await client.query(
        'UPDATE notes SET notebook_id = NULL, updated_at = NOW() WHERE user_id = $1 AND notebook_id = $2',
        [userId, notebookId],
      );
      const result = await client.query(
        'DELETE FROM notebooks WHERE id = $1 AND user_id = $2 RETURNING id',
        [notebookId, userId],
      );
      return result.rows[0] ?? null;
    },
  };
}
