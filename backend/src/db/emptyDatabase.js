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
  try {
    await client.query('BEGIN');

    const tables = await client.query(
      `SELECT format('%I.%I', schemaname, tablename) AS qualified_name
       FROM pg_catalog.pg_tables
       WHERE schemaname = 'public' AND tablename <> 'pgmigrations'
       ORDER BY tablename`,
    );
    const tableNames = tables.rows.map((row) => row.qualified_name);

    if (tableNames.length === 0) {
      await client.query('COMMIT');
      return;
    }

    await client.query(
      `TRUNCATE TABLE ${tableNames.join(', ')}
       RESTART IDENTITY CASCADE`,
    );
    await client.query('COMMIT');
  } catch (error) {
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
