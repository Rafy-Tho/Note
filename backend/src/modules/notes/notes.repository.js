import { randomUUID } from 'node:crypto';
import { query } from '../../db/query.js';

const NOTE_BASE_COLUMNS = `
  id, user_id, notebook_id, title, state, restore_state,
  is_favorite, revision, trashed_at,
  created_at, updated_at,
  COALESCE((
    SELECT JSON_ARRAYAGG(JSON_OBJECT('id', tags.id, 'name', tags.name))
    FROM tags
    INNER JOIN note_tags ON note_tags.tag_id = tags.id
    WHERE note_tags.note_id = notes.id
  ), JSON_ARRAY()) AS tags
`;

const NOTE_COLUMNS = `
  ${NOTE_BASE_COLUMNS}, content_json
`;

const NOTE_LIST_COLUMNS = `
  ${NOTE_BASE_COLUMNS}, LEFT(COALESCE(search_content, ''), 240) AS preview
`;

function toNote(row, { includeContent = true } = {}) {
  if (!row) return null;
  const note = {
    id: row.id,
    notebookId: row.notebook_id,
    title: row.title,
    state: row.state,
    restoreState: row.restore_state,
    isFavorite: Boolean(row.is_favorite),
    tags: row.tags ?? [],
    revision: row.revision,
    trashedAt: row.trashed_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
  if (includeContent) note.contentJson = row.content_json;
  if (row.preview !== undefined) note.preview = row.preview ?? '';
  return note;
}

function serializeContent(contentJson) {
  return contentJson === undefined || contentJson === null
    ? null
    : JSON.stringify(contentJson);
}

export function createNotesRepository(database = { query }) {
  async function findNote(connection, userId, noteId) {
    const result = await connection.query(
      `SELECT ${NOTE_COLUMNS} FROM notes WHERE id = ? AND user_id = ?`,
      [noteId, userId],
    );
    return toNote(result.rows[0]);
  }

  return {
    async list(userId, { state, favorite, notebookId = null, page, limit }) {
      const values = [userId, state];
      const filters = ['user_id = ?', 'state = ?'];
      if (favorite !== null) {
        values.push(favorite);
        filters.push('is_favorite = ?');
      }
      if (notebookId !== null) {
        values.push(notebookId);
        filters.push('notebook_id = ?');
      }
      const count = await database.query(
        `SELECT COUNT(*) AS total FROM notes WHERE ${filters.join(' AND ')}`,
        values,
      );
      values.push(limit, (page - 1) * limit);
      const result = await database.query(
        `SELECT ${NOTE_LIST_COLUMNS}
         FROM notes
         WHERE ${filters.join(' AND ')}
         ORDER BY updated_at DESC, id DESC
         LIMIT ? OFFSET ?`,
        values,
      );
      return {
        notes: result.rows.map((row) => toNote(row, { includeContent: false })),
        total: count.rows[0].total,
      };
    },

    async listFavorites(userId, { page, limit }) {
      const values = [userId, limit, (page - 1) * limit];
      const count = await database.query(
        `SELECT COUNT(*) AS total FROM notes
         WHERE user_id = ? AND is_favorite = TRUE AND state IN ('active', 'archived')`,
        [userId],
      );
      const result = await database.query(
        `SELECT ${NOTE_LIST_COLUMNS} FROM notes
         WHERE user_id = ? AND is_favorite = TRUE AND state IN ('active', 'archived')
         ORDER BY updated_at DESC, id DESC LIMIT ? OFFSET ?`,
        values,
      );
      return {
        notes: result.rows.map((row) => toNote(row, { includeContent: false })),
        total: count.rows[0].total,
      };
    },

    async findById(userId, noteId, connection = database) {
      return findNote(connection, userId, noteId);
    },

    async tagNames(connection, userId, noteId) {
      const result = await connection.query(
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

    async create(
      client,
      userId,
      {
        title,
        contentJson,
        searchableText,
        searchTitle,
        searchContent,
        searchTags,
      },
    ) {
      const noteId = randomUUID();
      await client.query(
        `INSERT INTO notes (
           id, user_id, title, content_json, searchable_text,
           search_title, search_content, search_tags
         )
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          noteId,
          userId,
          title,
          serializeContent(contentJson),
          searchableText,
          searchTitle,
          searchContent,
          searchTags,
        ],
      );
      return findNote(client, userId, noteId);
    },

    async update(
      client,
      userId,
      noteId,
      {
        title,
        contentJson,
        searchableText,
        searchTitle,
        searchContent,
        searchTags,
        revision,
      },
    ) {
      const result = await client.query(
        `UPDATE notes
         SET title = COALESCE(?, title),
             content_json = COALESCE(?, content_json),
             searchable_text = COALESCE(?, searchable_text),
             search_title = COALESCE(?, search_title),
             search_content = COALESCE(?, search_content),
             search_tags = COALESCE(?, search_tags),
             revision = revision + 1,
             updated_at = NOW()
         WHERE id = ? AND user_id = ? AND state IN ('active', 'archived') AND revision = ?`,
        [
          title ?? null,
          serializeContent(contentJson),
          searchableText ?? null,
          searchTitle ?? null,
          searchContent ?? null,
          searchTags ?? null,
          noteId,
          userId,
          revision,
        ],
      );
      if (result.rowCount !== 1) return null;
      return findNote(client, userId, noteId);
    },

    async moveToTrash(client, userId, noteId) {
      const result = await client.query(
        `UPDATE notes
         SET state = 'trashed',
             restore_state = state,
             trashed_at = NOW(),
             updated_at = NOW()
         WHERE id = ? AND user_id = ? AND state IN ('active', 'archived')`,
        [noteId, userId],
      );
      if (result.rowCount !== 1) return null;
      return findNote(client, userId, noteId);
    },

    async setState(client, userId, noteId, state) {
      const result = await client.query(
        `UPDATE notes SET state = ?, updated_at = NOW()
         WHERE id = ? AND user_id = ?`,
        [state, noteId, userId],
      );
      if (result.rowCount !== 1) return null;
      return findNote(client, userId, noteId);
    },

    async setFavorite(client, userId, noteId, isFavorite) {
      const result = await client.query(
        `UPDATE notes SET is_favorite = ?, updated_at = NOW()
         WHERE id = ? AND user_id = ?`,
        [isFavorite, noteId, userId],
      );
      if (result.rowCount !== 1) return null;
      return findNote(client, userId, noteId);
    },

    async assignNotebook(client, userId, noteId, notebookId) {
      const result = await client.query(
        `UPDATE notes SET notebook_id = ?, updated_at = NOW()
         WHERE id = ? AND user_id = ?`,
        [notebookId, noteId, userId],
      );
      if (result.rowCount !== 1) return null;
      return findNote(client, userId, noteId);
    },

    async permanentlyDelete(client, userId, noteId) {
      const result = await client.query(
        `DELETE FROM notes WHERE id = ? AND user_id = ? AND state = 'trashed'`,
        [noteId, userId],
      );
      return result.rowCount === 1 ? { id: noteId } : null;
    },

    async findOwnedNotebook(client, userId, notebookId) {
      if (!notebookId) return null;
      const result = await client.query(
        'SELECT id FROM notebooks WHERE id = ? AND user_id = ?',
        [notebookId, userId],
      );
      return result.rows[0] ?? null;
    },

    async restore(client, userId, noteId, { state, notebookId }) {
      const result = await client.query(
        `UPDATE notes
         SET state = ?,
             notebook_id = ?,
             restore_state = NULL,
             trashed_at = NULL,
             updated_at = NOW()
         WHERE id = ? AND user_id = ? AND state = 'trashed'`,
        [state, notebookId ?? null, noteId, userId],
      );
      if (result.rowCount !== 1) return null;
      return findNote(client, userId, noteId);
    },
  };
}
