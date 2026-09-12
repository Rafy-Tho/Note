import mysql from 'mysql2/promise';
import { getConfig } from '../config/env.js';

const config = getConfig();

function normalizeResult(result) {
  if (Array.isArray(result)) {
    return { rows: result, rowCount: result.length };
  }

  return {
    rows: [],
    rowCount: result?.affectedRows ?? 0,
    insertId: result?.insertId,
  };
}

function wrapConnection(connection) {
  return {
    query: async (text, values) => {
      const [result] = await connection.query(text, values);
      return normalizeResult(result);
    },
    release: () => connection.release(),
  };
}

const rawPool = mysql.createPool({
  uri: config.databaseUrl,
  waitForConnections: true,
  connectionLimit: 10,
  timezone: 'Z',
  flags: 'FOUND_ROWS',
});

export const pool = {
  query: async (text, values) => {
    const [result] = await rawPool.query(text, values);
    return normalizeResult(result);
  },
  getConnection: async () => wrapConnection(await rawPool.getConnection()),
  connect: async () => wrapConnection(await rawPool.getConnection()),
  end: () => rawPool.end(),
};

export async function checkDatabase() {
  await pool.query('SELECT 1');
}

export async function closeDatabase() {
  await pool.end();
}
