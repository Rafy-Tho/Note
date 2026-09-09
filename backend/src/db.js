import pg from 'pg';
import { getConfig } from './config.js';

const { Pool } = pg;
const config = getConfig();

export const pool = new Pool({
  connectionString: config.databaseUrl || undefined,
});

export async function checkDatabase() {
  await pool.query('SELECT 1');
}
