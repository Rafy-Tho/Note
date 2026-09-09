import { query } from '../../db/query.js';

const TAG_COLUMNS = 'id, user_id, name, normalized_name, created_at';

function toTag(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    createdAt: row.created_at,
  };
}

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

export function createTagsRepository(database = { query }) {
  return {
    async list(userId, { page, limit }) {
      const values = [userId];
      const count = await database.query(
        'SELECT COUNT(*)::integer AS total FROM tags WHERE user_id = $1',
        values,
      );
      values.push(limit, (page - 1) * limit);
      const result = await database.query(
        `SELECT tags.id, tags.user_id, tags.name, tags.normalized_name, tags.created_at
         FROM tags
         WHERE user_id = $1
         ORDER BY normalized_name, id
         LIMIT $2 OFFSET $3`,
        values,
      );
      return { tags: result.rows.map(toTag), total: count.rows[0].total };
    },

    async create(client, userId, { name, normalizedName }) {
      const result = await client.query(
        `INSERT INTO tags (user_id, name, normalized_name)
         VALUES ($1, $2, $3)
         RETURNING ${TAG_COLUMNS}`,
        [userId, name, normalizedName],
      );
      return toTag(result.rows[0]);
    },

    async findTag(client, userId, tagId) {
      const result = await client.query(
        `SELECT ${TAG_COLUMNS} FROM tags WHERE id = $1 AND user_id = $2`,
        [tagId, userId],
      );
      return toTag(result.rows[0]);
    },

    async findNote(client, userId, noteId) {
      const result = await client.query(
        `SELECT id, user_id, title, content_json, state, revision, created_at, updated_at
         FROM notes
         WHERE id = $1 AND user_id = $2`,
        [noteId, userId],
      );
      return result.rows[0] ?? null;
    },

    async assign(client, noteId, tagId) {
      await client.query(
        `INSERT INTO note_tags (note_id, tag_id)
         VALUES ($1, $2)
         ON CONFLICT (note_id, tag_id) DO NOTHING`,
        [noteId, tagId],
      );
    },

    async remove(client, userId, noteId, tagId) {
      await client.query(
        `DELETE FROM note_tags
         WHERE note_id = $1 AND tag_id = $2
           AND EXISTS (SELECT 1 FROM notes WHERE id = $1 AND user_id = $3)
           AND EXISTS (SELECT 1 FROM tags WHERE id = $2 AND user_id = $3)`,
        [noteId, tagId, userId],
      );
    },

    async tagNames(client, userId, noteId) {
      const result = await client.query(
        `SELECT tags.name
         FROM tags
         INNER JOIN note_tags ON note_tags.tag_id = tags.id
         INNER JOIN notes ON notes.id = note_tags.note_id
         WHERE tags.user_id = $1 AND notes.user_id = $1 AND notes.id = $2
         ORDER BY tags.normalized_name`,
        [userId, noteId],
      );
      return result.rows.map((row) => row.name);
    },

    async updateSearchProjection(
      client,
      userId,
      noteId,
      { searchableText, searchTitle, searchContent, searchTags },
    ) {
      await client.query(
        `UPDATE notes
         SET searchable_text = $3,
             search_title = $4,
             search_content = $5,
             search_tags = $6,
             search_vector =
               setweight(to_tsvector('simple', COALESCE($4, '')), 'A') ||
               setweight(to_tsvector('simple', COALESCE($5, '')), 'C') ||
               setweight(to_tsvector('simple', COALESCE($6, '')), 'B'),
             updated_at = NOW()
         WHERE id = $1 AND user_id = $2`,
        [
          noteId,
          userId,
          searchableText,
          searchTitle,
          searchContent,
          searchTags,
        ],
      );
    },

    async listNoteTags(client, userId, noteId) {
      const result = await client.query(
        `SELECT tags.id, tags.user_id, tags.name, tags.normalized_name, tags.created_at
         FROM tags
         INNER JOIN note_tags ON note_tags.tag_id = tags.id
         INNER JOIN notes ON notes.id = note_tags.note_id
         WHERE tags.user_id = $1 AND notes.user_id = $1 AND notes.id = $2
         ORDER BY tags.normalized_name`,
        [userId, noteId],
      );
      return result.rows.map(toTag);
    },

    async listNotesByTag(connection, userId, tagId, { page, limit }) {
      const values = [userId, tagId];
      const count = await connection.query(
        `SELECT COUNT(*)::integer AS total
         FROM notes
         INNER JOIN note_tags ON note_tags.note_id = notes.id
         WHERE notes.user_id = $1 AND note_tags.tag_id = $2
           AND notes.state IN ('active', 'archived')`,
        values,
      );
      values.push(limit, (page - 1) * limit);
      const result = await connection.query(
        `SELECT notes.id, notes.title, notes.content_json, notes.state,
                notes.revision, notes.created_at, notes.updated_at
         FROM notes
         INNER JOIN note_tags ON note_tags.note_id = notes.id
         WHERE notes.user_id = $1 AND note_tags.tag_id = $2
           AND notes.state IN ('active', 'archived')
         ORDER BY notes.updated_at DESC, notes.id DESC
         LIMIT $3 OFFSET $4`,
        values,
      );
      return { notes: result.rows.map(toNote), total: count.rows[0].total };
    },
  };
}
