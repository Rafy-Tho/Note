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

const SEARCH_FILTER = `
  notes.user_id = $1
  AND notes.state IN ('active', 'archived')
  AND notes.search_vector @@ websearch_to_tsquery('simple', $2)
`;

export function createSearchRepository(database = { query }) {
  return {
    async search(userId, { q, page, limit }) {
      const count = await database.query(
        `SELECT COUNT(*)::integer AS total
         FROM notes
         WHERE ${SEARCH_FILTER}`,
        [userId, q],
      );
      const result = await database.query(
        `SELECT notes.id, notes.title, notes.state, notes.updated_at,
                ts_rank_cd(
                  notes.search_vector,
                  websearch_to_tsquery('simple', $2)
                ) AS rank,
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
         FROM notes
         WHERE ${SEARCH_FILTER}
         ORDER BY rank DESC, notes.updated_at DESC, notes.id DESC
         LIMIT $3 OFFSET $4`,
        [userId, q, limit, (page - 1) * limit],
      );
      return { results: result.rows.map(toResult), total: count.rows[0].total };
    },
  };
}
