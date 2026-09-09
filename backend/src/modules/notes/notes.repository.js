import { query } from '../../db/query.js';

const NOTE_COLUMNS = `
  id, user_id, title, content_json, state, revision,
  created_at, updated_at
`;

function toNote(row) {
  if (!row) return null;
  return {
    id: row.id,
    title: row.title,
    contentJson: row.content_json,
    state: row.state,
    revision: row.revision,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function createNotesRepository(database = { query }) {
  return {
    async list(userId, { state, favorite, page, limit }) {
      const values = [userId, state];
      const filters = ['user_id = $1', 'state = $2'];
      if (favorite !== null) {
        values.push(favorite);
        filters.push(`is_favorite = $${values.length}`);
      }
      const count = await database.query(
        `SELECT COUNT(*)::integer AS total FROM notes WHERE ${filters.join(' AND ')}`,
        values,
      );
      values.push(limit, (page - 1) * limit);
      const result = await database.query(
        `SELECT ${NOTE_COLUMNS}
         FROM notes
         WHERE ${filters.join(' AND ')}
         ORDER BY updated_at DESC, id DESC
         LIMIT $${values.length - 1} OFFSET $${values.length}`,
        values,
      );
      return { notes: result.rows.map(toNote), total: count.rows[0].total };
    },

    async findById(userId, noteId) {
      const result = await database.query(
        `SELECT ${NOTE_COLUMNS} FROM notes WHERE id = $1 AND user_id = $2`,
        [noteId, userId],
      );
      return toNote(result.rows[0]);
    },

    async create(client, userId, { title, contentJson, searchableText }) {
      const result = await client.query(
        `INSERT INTO notes (user_id, title, content_json, searchable_text)
         VALUES ($1, $2, $3, $4)
         RETURNING ${NOTE_COLUMNS}`,
        [userId, title, contentJson, searchableText],
      );
      return toNote(result.rows[0]);
    },

    async update(
      client,
      userId,
      noteId,
      { title, contentJson, searchableText, revision },
    ) {
      const result = await client.query(
        `UPDATE notes
         SET title = COALESCE($3, title),
             content_json = COALESCE($4, content_json),
             searchable_text = COALESCE($5, searchable_text),
             revision = revision + 1,
             updated_at = NOW()
         WHERE id = $1 AND user_id = $2 AND state IN ('active', 'archived') AND revision = $6
         RETURNING ${NOTE_COLUMNS}`,
        [
          noteId,
          userId,
          title ?? null,
          contentJson ?? null,
          searchableText ?? null,
          revision,
        ],
      );
      return toNote(result.rows[0]);
    },
  };
}
