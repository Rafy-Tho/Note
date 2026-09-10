import { query } from '../../db/query.js';

export function createSidebarCountsRepository(database = { query }) {
  return {
    async get(userId) {
      const summary = await database.query(
        `SELECT
           COUNT(*) FILTER (WHERE state = 'active')::integer AS notes,
           COUNT(*) FILTER (
             WHERE is_favorite = TRUE AND state IN ('active', 'archived')
           )::integer AS favorites,
           COUNT(*) FILTER (WHERE state = 'archived')::integer AS archive,
           COUNT(*) FILTER (WHERE state = 'trashed')::integer AS trash,
           (SELECT COUNT(*)::integer
            FROM notes
            WHERE user_id = $1
              AND notebook_id IS NOT NULL
              AND state IN ('active', 'archived')) AS notebooks,
           (SELECT COUNT(DISTINCT note_tags.note_id)::integer
            FROM note_tags
            INNER JOIN tags ON tags.id = note_tags.tag_id
            INNER JOIN notes ON notes.id = note_tags.note_id
            WHERE tags.user_id = $1
              AND notes.user_id = $1
              AND notes.state IN ('active', 'archived')) AS tags
         FROM notes
         WHERE user_id = $1`,
        [userId],
      );
      const notebooks = await database.query(
        `SELECT notebooks.id,
                COUNT(notes.id)::integer AS count
         FROM notebooks
         LEFT JOIN notes
           ON notes.notebook_id = notebooks.id
          AND notes.user_id = notebooks.user_id
          AND notes.state IN ('active', 'archived')
         WHERE notebooks.user_id = $1
         GROUP BY notebooks.id
         ORDER BY notebooks.id`,
        [userId],
      );
      const tags = await database.query(
        `SELECT tags.id,
                COUNT(DISTINCT notes.id)::integer AS count
         FROM tags
         LEFT JOIN note_tags ON note_tags.tag_id = tags.id
         LEFT JOIN notes
           ON notes.id = note_tags.note_id
          AND notes.user_id = tags.user_id
          AND notes.state IN ('active', 'archived')
         WHERE tags.user_id = $1
         GROUP BY tags.id
         ORDER BY tags.id`,
        [userId],
      );

      const row = summary.rows[0];
      return {
        notes: row.notes,
        favorites: row.favorites,
        archive: row.archive,
        trash: row.trash,
        notebooks: row.notebooks,
        tags: row.tags,
        notebookCounts: notebooks.rows.map((item) => ({
          id: item.id,
          count: item.count,
        })),
        tagCounts: tags.rows.map((item) => ({ id: item.id, count: item.count })),
      };
    },
  };
}
