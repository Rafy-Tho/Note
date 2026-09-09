import { query } from '../../db/query.js';

const NOTE_COLUMNS = `
  id, user_id, notebook_id, title, content_json, state, restore_state,
  is_favorite, revision, trashed_at,
  created_at, updated_at,
  COALESCE((
    SELECT json_agg(json_build_object('id', tag_rows.id, 'name', tag_rows.name)
                   ORDER BY tag_rows.normalized_name)
    FROM (
      SELECT tags.id, tags.name, tags.normalized_name
      FROM tags
      INNER JOIN note_tags ON note_tags.tag_id = tags.id
      WHERE note_tags.note_id = notes.id
    ) AS tag_rows
  ), '[]'::json) AS tags
`;

const SEARCH_VECTOR_FROM_CREATE_VALUES = `
  setweight(to_tsvector('simple', COALESCE($5, '')), 'A') ||
  setweight(to_tsvector('simple', COALESCE($6, '')), 'C') ||
  setweight(to_tsvector('simple', COALESCE($7, '')), 'B')
`;

function toNote(row) {
  if (!row) return null;
  return {
    id: row.id,
    notebookId: row.notebook_id,
    title: row.title,
    contentJson: row.content_json,
    state: row.state,
    restoreState: row.restore_state,
    isFavorite: row.is_favorite,
    tags: row.tags ?? [],
    revision: row.revision,
    trashedAt: row.trashed_at,
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

    async findById(userId, noteId, connection = database) {
      const result = await connection.query(
        `SELECT ${NOTE_COLUMNS} FROM notes WHERE id = $1 AND user_id = $2`,
        [noteId, userId],
      );
      return toNote(result.rows[0]);
    },

    async tagNames(connection, userId, noteId) {
      const result = await connection.query(
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
      const result = await client.query(
        `INSERT INTO notes (
           user_id, title, content_json, searchable_text,
           search_title, search_content, search_tags, search_vector
         )
         VALUES ($1, $2, $3, $4, $5, $6, $7, ${SEARCH_VECTOR_FROM_CREATE_VALUES})
         RETURNING ${NOTE_COLUMNS}`,
        [
          userId,
          title,
          contentJson,
          searchableText,
          searchTitle,
          searchContent,
          searchTags,
        ],
      );
      return toNote(result.rows[0]);
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
       SET title = COALESCE($3, title),
           content_json = COALESCE($4, content_json),
           searchable_text = COALESCE($5, searchable_text),
           search_title = COALESCE($6, search_title),
           search_content = COALESCE($7, search_content),
           search_tags = COALESCE($8, search_tags),
           search_vector =
             setweight(to_tsvector('simple', COALESCE($6, search_title)), 'A') ||
             setweight(to_tsvector('simple', COALESCE($7, search_content)), 'C') ||
             setweight(to_tsvector('simple', COALESCE($8, search_tags)), 'B'),
           revision = revision + 1,
             updated_at = NOW()
         WHERE id = $1 AND user_id = $2 AND state IN ('active', 'archived') AND revision = $9
         RETURNING ${NOTE_COLUMNS}`,
        [
          noteId,
          userId,
          title ?? null,
          contentJson ?? null,
          searchableText ?? null,
          searchTitle ?? null,
          searchContent ?? null,
          searchTags ?? null,
          revision,
        ],
      );
      return toNote(result.rows[0]);
    },

    async moveToTrash(client, userId, noteId) {
      const result = await client.query(
        `UPDATE notes
         SET state = 'trashed',
             restore_state = state,
             trashed_at = NOW(),
             updated_at = NOW()
         WHERE id = $1 AND user_id = $2 AND state IN ('active', 'archived')
         RETURNING ${NOTE_COLUMNS}`,
        [noteId, userId],
      );
      return toNote(result.rows[0]);
    },

    async findOwnedNotebook(client, userId, notebookId) {
      if (!notebookId) return null;
      const result = await client.query(
        'SELECT id FROM notebooks WHERE id = $1 AND user_id = $2',
        [notebookId, userId],
      );
      return result.rows[0] ?? null;
    },

    async restore(client, userId, noteId, { state, notebookId }) {
      const result = await client.query(
        `UPDATE notes
         SET state = $3,
             notebook_id = $4,
             restore_state = NULL,
             trashed_at = NULL,
             updated_at = NOW()
         WHERE id = $1 AND user_id = $2 AND state = 'trashed'
         RETURNING ${NOTE_COLUMNS}`,
        [noteId, userId, state, notebookId ?? null],
      );
      return toNote(result.rows[0]);
    },
  };
}
