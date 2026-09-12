export const up = [
  `CREATE TABLE users (
     id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
     email VARCHAR(320) NOT NULL,
     password_hash VARCHAR(255) NOT NULL,
     created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
     updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
     PRIMARY KEY (id),
     UNIQUE KEY users_email_unique (email)
   ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci`,

  `CREATE TABLE sessions (
     id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
     user_id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
     token_hash VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
     created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
     last_used_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
     expires_at DATETIME(3) NOT NULL,
     revoked_at DATETIME(3) NULL,
     PRIMARY KEY (id),
     UNIQUE KEY sessions_token_hash_unique (token_hash),
     KEY sessions_user_id_idx (user_id),
     CONSTRAINT sessions_user_id_fk
       FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
   ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci`,

  `CREATE TABLE notebooks (
     id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
     user_id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
     name VARCHAR(255) NOT NULL,
     normalized_name VARCHAR(255) NOT NULL,
     created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
     updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
     PRIMARY KEY (id),
     UNIQUE KEY notebooks_user_name_unique (user_id, normalized_name),
     CONSTRAINT notebooks_user_id_fk
       FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
   ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci`,

  `CREATE TABLE notes (
     id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
     user_id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
     notebook_id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NULL,
     title VARCHAR(255) NOT NULL DEFAULT '',
     content_json JSON NOT NULL DEFAULT (JSON_OBJECT('type', 'doc', 'content', JSON_ARRAY())),
     searchable_text MEDIUMTEXT NOT NULL,
     state VARCHAR(20) NOT NULL DEFAULT 'active',
     restore_state VARCHAR(20) NULL,
     is_favorite TINYINT(1) NOT NULL DEFAULT 0,
     revision INT NOT NULL DEFAULT 0,
     created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
     updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
     trashed_at DATETIME(3) NULL,
     PRIMARY KEY (id),
     KEY notes_user_id_idx (user_id),
     KEY notes_notebook_id_idx (notebook_id),
     CONSTRAINT notes_user_id_fk
       FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
     CONSTRAINT notes_notebook_id_fk
       FOREIGN KEY (notebook_id) REFERENCES notebooks (id) ON DELETE SET NULL,
     CONSTRAINT notes_state_check
       CHECK (state IN ('active', 'archived', 'trashed')),
     CONSTRAINT notes_restore_state_check
       CHECK (restore_state IS NULL OR restore_state IN ('active', 'archived')),
     CONSTRAINT notes_revision_check CHECK (revision >= 0)
   ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci`,

  `CREATE TABLE tags (
     id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
     user_id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
     name VARCHAR(255) NOT NULL,
     normalized_name VARCHAR(255) NOT NULL,
     created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
     PRIMARY KEY (id),
     UNIQUE KEY tags_user_name_unique (user_id, normalized_name),
     CONSTRAINT tags_user_id_fk
       FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
   ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci`,

  `CREATE TABLE note_tags (
     note_id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
     tag_id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
     PRIMARY KEY (note_id, tag_id),
     KEY note_tags_tag_note_idx (tag_id, note_id),
     CONSTRAINT note_tags_note_id_fk
       FOREIGN KEY (note_id) REFERENCES notes (id) ON DELETE CASCADE,
     CONSTRAINT note_tags_tag_id_fk
       FOREIGN KEY (tag_id) REFERENCES tags (id) ON DELETE CASCADE
   ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci`,
];

export const down = [
  'DROP TABLE IF EXISTS note_tags',
  'DROP TABLE IF EXISTS tags',
  'DROP TABLE IF EXISTS notes',
  'DROP TABLE IF EXISTS notebooks',
  'DROP TABLE IF EXISTS sessions',
  'DROP TABLE IF EXISTS users',
];
