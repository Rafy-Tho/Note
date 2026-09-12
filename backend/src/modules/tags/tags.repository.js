import { randomUUID } from 'node:crypto';
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
    preview: row.preview ?? '',
    state: row.state,
    revision: row.revision,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function createTagsRepository(database = { query }) {
  async function findTagRow(connection, userId, tagId) {
    const result = await connection.query(
      `SELECT ${TAG_COLUMNS} FROM tags WHERE id = ? AND user_id = ?`,
      [tagId, userId],
    );
    return result.rows[0] ?? null;
  }

  return {
    async list(userId, { page, limit }) {
      const values = [userId];
      const count = await database.query(
        'SELECT COUNT(*) AS total FROM tags WHERE user_id = ?',
        values,
      );
      values.push(limit, (page - 1) * limit);
      const result = await database.query(
        `SELECT tags.id, tags.user_id, tags.name, tags.normalized_name, tags.created_at
         FROM tags
         WHERE user_id = ?
         ORDER BY normalized_name, id
         LIMIT ? OFFSET ?`,
        values,
      );
      return { tags: result.rows.map(toTag), total: count.rows[0].total };
    },

    async create(client, userId, { name, normalizedName }) {
      const tagId = randomUUID();
      await client.query(
        `INSERT INTO tags (id, user_id, name, normalized_name)
         VALUES (?, ?, ?, ?)`,
        [tagId, userId, name, normalizedName],
      );
      return toTag(await findTagRow(client, userId, tagId));
    },

    async rename(client, userId, tagId, { name, normalizedName }) {
      const result = await client.query(
        `UPDATE tags
         SET name = ?, normalized_name = ?
         WHERE id = ? AND user_id = ?`,
        [name, normalizedName, tagId, userId],
      );
      if (result.rowCount !== 1) return null;
      return toTag(await findTagRow(client, userId, tagId));
    },

    async delete(client, userId, tagId) {
      const result = await client.query(
        'DELETE FROM tags WHERE id = ? AND user_id = ?',
        [tagId, userId],
      );
      return result.rowCount === 1 ? { id: tagId } : null;
    },

    async removeFromNotes(client, userId, tagId) {
      await client.query(
        `DELETE FROM note_tags
         WHERE tag_id = ?
           AND EXISTS (SELECT 1 FROM tags WHERE id = ? AND user_id = ?)
           AND EXISTS (SELECT 1 FROM notes WHERE id = note_tags.note_id AND user_id = ?)`,
        [tagId, tagId, userId, userId],
      );
    },

    async findTag(client, userId, tagId) {
      return toTag(await findTagRow(client, userId, tagId));
    },

    async findNote(client, userId, noteId) {
      const result = await client.query(
        `SELECT id, user_id, title, content_json, state, revision, created_at, updated_at
         FROM notes
         WHERE id = ? AND user_id = ?`,
        [noteId, userId],
      );
      return result.rows[0] ?? null;
    },

    async listNotesForTag(client, userId, tagId) {
      const result = await client.query(
        `SELECT notes.id, notes.title, notes.content_json
         FROM notes
         INNER JOIN note_tags ON note_tags.note_id = notes.id
         WHERE notes.user_id = ? AND note_tags.tag_id = ?`,
        [userId, tagId],
      );
      return result.rows;
    },

    async assign(client, noteId, tagId) {
      await client.query(
        `INSERT IGNORE INTO note_tags (note_id, tag_id)
         VALUES (?, ?)`,
        [noteId, tagId],
      );
    },

    async remove(client, userId, noteId, tagId) {
      await client.query(
        `DELETE FROM note_tags
         WHERE note_id = ? AND tag_id = ?
           AND EXISTS (SELECT 1 FROM notes WHERE id = ? AND user_id = ?)
           AND EXISTS (SELECT 1 FROM tags WHERE id = ? AND user_id = ?)`,
        [noteId, tagId, noteId, userId, tagId, userId],
      );
    },

    async tagNames(client, userId, noteId) {
      const result = await client.query(
        `SELECT tags.name
         FROM tags
         INNER JOIN note_tags ON note_tags.tag_id = tags.id
         INNER JOIN notes ON notes.id = note_tags.note_id
         WHERE tags.user_id = ? AND notes.user_id = ? AND notes.id = ?
         ORDER BY tags.normalized_name`,
        [userId, userId, noteId],
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
         SET searchable_text = ?,
             search_title = ?,
             search_content = ?,
             search_tags = ?,
             updated_at = NOW()
         WHERE id = ? AND user_id = ?`,
        [
          searchableText,
          searchTitle,
          searchContent,
          searchTags,
          noteId,
          userId,
        ],
      );
    },

    async listNoteTags(client, userId, noteId) {
      const result = await client.query(
        `SELECT tags.id, tags.user_id, tags.name, tags.normalized_name, tags.created_at
         FROM tags
         INNER JOIN note_tags ON note_tags.tag_id = tags.id
         INNER JOIN notes ON notes.id = note_tags.note_id
         WHERE tags.user_id = ? AND notes.user_id = ? AND notes.id = ?
         ORDER BY tags.normalized_name`,
        [userId, userId, noteId],
      );
      return result.rows.map(toTag);
    },

    async listNotesByTag(connection, userId, tagId, { page, limit }) {
      const values = [userId, tagId];
      const count = await connection.query(
        `SELECT COUNT(*) AS total
         FROM notes
         INNER JOIN note_tags ON note_tags.note_id = notes.id
         WHERE notes.user_id = ? AND note_tags.tag_id = ?
           AND notes.state IN ('active', 'archived')`,
        values,
      );
      values.push(limit, (page - 1) * limit);
      const result = await connection.query(
        `SELECT notes.id, notes.title,
                LEFT(COALESCE(notes.search_content, ''), 240) AS preview,
                notes.state, notes.revision, notes.created_at, notes.updated_at
         FROM notes
         INNER JOIN note_tags ON note_tags.note_id = notes.id
         WHERE notes.user_id = ? AND note_tags.tag_id = ?
           AND notes.state IN ('active', 'archived')
         ORDER BY notes.updated_at DESC, notes.id DESC
         LIMIT ? OFFSET ?`,
        values,
      );
      return { notes: result.rows.map(toNote), total: count.rows[0].total };
    },
  };
}
