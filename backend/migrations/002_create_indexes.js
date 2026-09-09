export function up(pgm) {
  pgm.sql(`
    CREATE INDEX sessions_user_id_idx ON sessions (user_id);
    CREATE INDEX sessions_expiry_idx ON sessions (expires_at);
    CREATE INDEX notes_user_state_updated_idx ON notes (user_id, state, updated_at DESC);
    CREATE INDEX notes_user_notebook_state_idx ON notes (user_id, notebook_id, state);
    CREATE INDEX notes_user_favorite_state_idx ON notes (user_id, is_favorite, state);
    CREATE INDEX notes_user_trashed_idx ON notes (user_id, trashed_at);
    CREATE INDEX notebooks_user_name_idx ON notebooks (user_id, normalized_name);
    CREATE INDEX tags_user_name_idx ON tags (user_id, normalized_name);
    CREATE INDEX note_tags_tag_note_idx ON note_tags (tag_id, note_id);
    CREATE INDEX notes_search_idx ON notes
      USING GIN (to_tsvector('simple', searchable_text));
  `);
}

export function down(pgm) {
  pgm.sql(`
    DROP INDEX IF EXISTS notes_search_idx;
    DROP INDEX IF EXISTS note_tags_tag_note_idx;
    DROP INDEX IF EXISTS tags_user_name_idx;
    DROP INDEX IF EXISTS notebooks_user_name_idx;
    DROP INDEX IF EXISTS notes_user_trashed_idx;
    DROP INDEX IF EXISTS notes_user_favorite_state_idx;
    DROP INDEX IF EXISTS notes_user_notebook_state_idx;
    DROP INDEX IF EXISTS notes_user_state_updated_idx;
    DROP INDEX IF EXISTS sessions_expiry_idx;
    DROP INDEX IF EXISTS sessions_user_id_idx;
  `);
}
