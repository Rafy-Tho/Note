export const up = [
  `ALTER TABLE notes
     ADD COLUMN search_title VARCHAR(255) NOT NULL DEFAULT '',
     ADD COLUMN search_content MEDIUMTEXT NOT NULL,
     ADD COLUMN search_tags VARCHAR(1000) NOT NULL DEFAULT ''`,

  `UPDATE notes
   SET search_title = title,
       search_content = searchable_text,
       search_tags = COALESCE((
         SELECT GROUP_CONCAT(tags.name ORDER BY tags.normalized_name SEPARATOR ' ')
         FROM tags
         INNER JOIN note_tags ON note_tags.tag_id = tags.id
         WHERE note_tags.note_id = notes.id
       ), '')`,

  'CREATE FULLTEXT INDEX notes_search_ft_idx ON notes (search_title, search_content, search_tags)',
];

export const down = [
  'DROP INDEX notes_search_ft_idx ON notes',
  `ALTER TABLE notes
     DROP COLUMN search_tags,
     DROP COLUMN search_content,
     DROP COLUMN search_title`,
];
