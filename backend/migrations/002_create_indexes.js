export const up = [
  'CREATE INDEX sessions_expiry_idx ON sessions (expires_at)',
  'CREATE INDEX notes_user_state_updated_idx ON notes (user_id, state, updated_at DESC)',
  'CREATE INDEX notes_user_notebook_state_idx ON notes (user_id, notebook_id, state)',
  'CREATE INDEX notes_user_favorite_state_idx ON notes (user_id, is_favorite, state)',
  'CREATE INDEX notes_user_trashed_idx ON notes (user_id, trashed_at)',
  'CREATE INDEX notebooks_user_name_idx ON notebooks (user_id, normalized_name)',
  'CREATE INDEX tags_user_name_idx ON tags (user_id, normalized_name)',
];

export const down = [
  'DROP INDEX tags_user_name_idx ON tags',
  'DROP INDEX notebooks_user_name_idx ON notebooks',
  'DROP INDEX notes_user_trashed_idx ON notes',
  'DROP INDEX notes_user_favorite_state_idx ON notes',
  'DROP INDEX notes_user_notebook_state_idx ON notes',
  'DROP INDEX notes_user_state_updated_idx ON notes',
  'DROP INDEX sessions_expiry_idx ON sessions',
];
