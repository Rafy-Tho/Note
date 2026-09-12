import { query } from '../../db/query.js';

function toResult(row) {
  return {
    id: row.id,
    title: row.title,
    state: row.state,
    tags: row.tags ?? [],
    updatedAt: row.updated_at,
    rank: Number(row.rank),
  };
}

const SEARCH_MATCH =
  'MATCH(notes.search_title, notes.search_content, notes.search_tags) AGAINST (? IN NATURAL LANGUAGE MODE)';

const SEARCH_FILTER = `
  notes.user_id = ?
  AND notes.state IN ('active', 'archived')
  AND ${SEARCH_MATCH}
`;

export function createSearchRepository(database = { query }) {
  return {
    async search(userId, { q, page, limit }) {
      const count = await database.query(
        `SELECT COUNT(*) AS total
         FROM notes
         WHERE ${SEARCH_FILTER}`,
        [userId, q],
      );
      const result = await database.query(
        `SELECT notes.id, notes.title, notes.state, notes.updated_at,
                ${SEARCH_MATCH} AS rank,
                COALESCE((
                  SELECT JSON_ARRAYAGG(JSON_OBJECT('id', tags.id, 'name', tags.name))
                  FROM tags
                  INNER JOIN note_tags ON note_tags.tag_id = tags.id
                  WHERE note_tags.note_id = notes.id
                ), JSON_ARRAY()) AS tags
         FROM notes
         WHERE ${SEARCH_FILTER}
         ORDER BY rank DESC, notes.updated_at DESC, notes.id DESC
         LIMIT ? OFFSET ?`,
        [q, userId, q, limit, (page - 1) * limit],
      );
      return { results: result.rows.map(toResult), total: count.rows[0].total };
    },
  };
}
