import { readdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { pool } from './pool.js';

const migrationsDir = join(
  dirname(fileURLToPath(import.meta.url)),
  '..',
  '..',
  'migrations',
);

async function listMigrationFiles() {
  const entries = await readdir(migrationsDir);
  return entries.filter((name) => name.endsWith('.js')).sort();
}

async function ensureMigrationsTable(connection) {
  await connection.query(
    `CREATE TABLE IF NOT EXISTS schema_migrations (
       version VARCHAR(255) NOT NULL,
       applied_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
       PRIMARY KEY (version)
     ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin`,
  );
}

async function appliedVersions(connection) {
  const result = await connection.query(
    'SELECT version FROM schema_migrations ORDER BY version',
  );
  return new Set(result.rows.map((row) => row.version));
}

export async function migrate(direction = 'up', databasePool = pool) {
  if (direction !== 'up' && direction !== 'down') {
    throw new Error('Migration direction must be "up" or "down".');
  }

  const connection = await databasePool.getConnection();
  try {
    await ensureMigrationsTable(connection);
    const files = await listMigrationFiles();
    const applied = await appliedVersions(connection);
    const ordered = direction === 'down' ? [...files].reverse() : files;

    for (const file of ordered) {
      const version = file.replace(/\.js$/, '');
      const isApplied = applied.has(version);
      if (direction === 'up' && isApplied) continue;
      if (direction === 'down' && !isApplied) continue;

      const migration = await import(
        pathToFileURL(join(migrationsDir, file)).href
      );
      const statements = direction === 'up' ? migration.up : migration.down;
      if (!Array.isArray(statements)) {
        throw new Error(
          `Migration ${file} does not export ${direction} steps.`,
        );
      }

      try {
        for (const statement of statements) {
          await connection.query(statement);
        }
      } catch (error) {
        error.migration = version;
        throw error;
      }

      if (direction === 'up') {
        await connection.query(
          'INSERT INTO schema_migrations (version) VALUES (?)',
          [version],
        );
      } else {
        await connection.query(
          'DELETE FROM schema_migrations WHERE version = ?',
          [version],
        );
      }
    }
  } finally {
    connection.release();
  }
}
