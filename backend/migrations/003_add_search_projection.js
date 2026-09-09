export function up(pgm) {
  pgm.sql(`
    ALTER TABLE notes
      ADD COLUMN search_title TEXT NOT NULL DEFAULT '',
      ADD COLUMN search_content TEXT NOT NULL DEFAULT '',
      ADD COLUMN search_tags TEXT NOT NULL DEFAULT '',
      ADD COLUMN search_vector TSVECTOR NOT NULL DEFAULT ''::tsvector;

    UPDATE notes
    SET search_title = title,
        search_content = searchable_text,
        search_tags = COALESCE((
          SELECT string_agg(tags.name, ' ' ORDER BY tags.normalized_name)
          FROM tags
          INNER JOIN note_tags ON note_tags.tag_id = tags.id
          WHERE note_tags.note_id = notes.id
        ), ''),
        search_vector =
          setweight(to_tsvector('simple', COALESCE(title, '')), 'A') ||
          setweight(to_tsvector('simple', COALESCE(searchable_text, '')), 'C') ||
          setweight(to_tsvector('simple', COALESCE((
            SELECT string_agg(tags.name, ' ' ORDER BY tags.normalized_name)
            FROM tags
            INNER JOIN note_tags ON note_tags.tag_id = tags.id
            WHERE note_tags.note_id = notes.id
          ), '')), 'B');

    DROP INDEX IF EXISTS notes_search_idx;
    CREATE INDEX notes_search_vector_idx ON notes USING GIN (search_vector);
  `);
}

export function down(pgm) {
  pgm.sql(`
    DROP INDEX IF EXISTS notes_search_vector_idx;
    CREATE INDEX notes_search_idx ON notes
      USING GIN (to_tsvector('simple', searchable_text));
    ALTER TABLE notes
      DROP COLUMN IF EXISTS search_vector,
      DROP COLUMN IF EXISTS search_tags,
      DROP COLUMN IF EXISTS search_content,
      DROP COLUMN IF EXISTS search_title;
  `);
}
