import { pool } from './pool.js';

export const EMPTY_DATABASE_CONFIRMATION = 'EMPTY_DATABASE';

export async function emptyDatabase({
  databasePool = pool,
  nodeEnv = process.env.NODE_ENV ?? 'development',
  confirmation,
} = {}) {
  if (nodeEnv === 'production') {
    throw new Error('Database emptying is disabled in production.');
  }
  if (confirmation !== EMPTY_DATABASE_CONFIRMATION) {
    throw new Error(
      `Database emptying requires confirmation: ${EMPTY_DATABASE_CONFIRMATION}`,
    );
  }

  const client = await databasePool.connect();
  let foreignKeyChecksDisabled = false;
  try {
    await client.query('BEGIN');

    const tables = await client.query(
      `SELECT table_name
       FROM information_schema.tables
       WHERE table_schema = DATABASE() AND table_name <> 'schema_migrations'
       ORDER BY table_name`,
    );
    const tableNames = tables.rows.map((row) => row.table_name);

    if (tableNames.length === 0) {
      await client.query('COMMIT');
      return;
    }

    await client.query('SET FOREIGN_KEY_CHECKS = 0');
    foreignKeyChecksDisabled = true;
    await client.query(
      `TRUNCATE TABLE ${tableNames.map((name) => `\`${name}\``).join(', ')}`,
    );
    await client.query('SET FOREIGN_KEY_CHECKS = 1');
    foreignKeyChecksDisabled = false;
    await client.query('COMMIT');
  } catch (error) {
    if (foreignKeyChecksDisabled) {
      try {
        await client.query('SET FOREIGN_KEY_CHECKS = 1');
      } catch {
        // Preserve the original reset error.
      }
    }
    try {
      await client.query('ROLLBACK');
    } catch {
      // Preserve the original reset error.
    }
    throw error;
  } finally {
    client.release();
  }
}
