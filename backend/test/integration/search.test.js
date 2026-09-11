import pg from 'pg';
import { describe, expect, it } from 'vitest';
import { performance } from 'node:perf_hooks';
import { createSearchRepository } from '../../src/modules/search/search.repository.js';

const databaseUrl = process.env.DATABASE_URL;
const databaseTest = databaseUrl ? describe : describe.skip;

databaseTest('database search', () => {
  it('searches the weighted projection within the performance target', async () => {
    const pool = new pg.Pool({ connectionString: databaseUrl });
    const client = await pool.connect();
    const search = createSearchRepository({
      query: (...args) => client.query(...args),
    });
    let userId;

    try {
      const user = await client.query(
        `INSERT INTO users (email)
         VALUES ($1)
         RETURNING id`,
        [`search-integration-${Date.now()}@example.test`],
      );
      userId = user.rows[0].id;
      for (let index = 0; index < 200; index += 1) {
        const title = index === 0 ? 'Weighted title match' : `Note ${index}`;
        const content =
          index === 1 || index === 4
            ? `Weighted ${index === 1 ? 'content match' : 'archived match'}`
            : `Content ${index}`;
        const tags = index === 2 ? 'Weighted tag match' : '';
        await client.query(
          `INSERT INTO notes (
             user_id, title, searchable_text, search_title, search_content,
             search_tags, search_vector, state
           )
           VALUES (
             $1, $2, $3, $4, $5, $6,
             setweight(to_tsvector('simple', $4), 'A') ||
             setweight(to_tsvector('simple', $5), 'C') ||
             setweight(to_tsvector('simple', $6), 'B'),
             $7
           )`,
          [
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
      expect(titleResult.results[0].title).toBe('Weighted title match');

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
        await client.query('DELETE FROM users WHERE id = $1', [userId]);
      client.release();
      await pool.end();
    }
  });
});
