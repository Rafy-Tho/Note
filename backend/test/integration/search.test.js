import mysql from 'mysql2/promise';
import { randomUUID } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { performance } from 'node:perf_hooks';
import { createSearchRepository } from '../../src/modules/search/search.repository.js';

const databaseUrl = process.env.DATABASE_URL;
const databaseTest = databaseUrl ? describe : describe.skip;

function createPool() {
  return mysql.createPool({ uri: databaseUrl, timezone: 'Z' });
}

function normalize(result) {
  if (Array.isArray(result)) return { rows: result, rowCount: result.length };
  return { rows: [], rowCount: result.affectedRows ?? 0 };
}

async function connect(pool) {
  const connection = await pool.getConnection();
  return {
    query: async (text, values) => {
      const [result] = await connection.query(text, values);
      return normalize(result);
    },
    release: () => connection.release(),
  };
}

databaseTest('database search', () => {
  it('searches the full-text projection within the performance target', async () => {
    const pool = createPool();
    const client = await connect(pool);
    const search = createSearchRepository({
      query: (...args) => client.query(...args),
    });
    let userId;

    try {
      userId = randomUUID();
      await client.query('INSERT INTO users (id, email) VALUES (?, ?)', [
        userId,
        `search-integration-${Date.now()}@example.test`,
      ]);
      for (let index = 0; index < 200; index += 1) {
        const title = index === 0 ? 'Weighted title match' : `Note ${index}`;
        const content =
          index === 1 || index === 4
            ? `Weighted ${index === 1 ? 'content match' : 'archived match'}`
            : `Content ${index}`;
        const tags = index === 2 ? 'Weighted tag match' : '';
        await client.query(
          `INSERT INTO notes (
             id, user_id, title, searchable_text, search_title, search_content,
             search_tags, state
           )
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            randomUUID(),
            userId,
            title,
            `${title} ${content} ${tags}`,
            title,
            content,
            tags,
            index === 3 ? 'trashed' : index === 4 ? 'archived' : 'active',
          ],
        );
      }

      const titleResult = await search.search(userId, {
        q: 'Weighted',
        page: 1,
        limit: 20,
      });
      expect(titleResult.total).toBe(4);
      expect(titleResult.results.map((item) => item.title)).toContain(
        'Weighted title match',
      );

      const durations = [];
      for (let index = 0; index < 20; index += 1) {
        const started = performance.now();
        await search.search(userId, { q: 'Weighted', page: 1, limit: 20 });
        durations.push(performance.now() - started);
      }
      durations.sort((left, right) => left - right);
      const p95 = durations[Math.ceil(durations.length * 0.95) - 1];
      expect(p95).toBeLessThan(500);
    } finally {
      if (userId)
        await client.query('DELETE FROM users WHERE id = ?', [userId]);
      client.release();
      await pool.end();
    }
  }, 60000);
});
