import { pool } from './pool.js';

export async function withTransaction(work, databasePool = pool) {
  const client = await databasePool.connect();

  try {
    await client.query('BEGIN');
    const result = await work(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    try {
      await client.query('ROLLBACK');
    } catch {
      // Preserve the original operation error.
    }
    throw error;
  } finally {
    client.release();
  }
}
