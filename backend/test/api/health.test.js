import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from '../../src/app.js';

describe('GET /api/v1/health', () => {
  it('reports a healthy API and database', async () => {
    const app = createApp({ databaseCheck: async () => {} });

    const response = await request(app).get('/api/v1/health');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ data: { status: 'ok', database: 'ok' } });
  });

  it('does not expose database details when the check fails', async () => {
    const app = createApp({
      databaseCheck: async () => {
        throw new Error('private database detail');
      },
    });

    const response = await request(app).get('/api/v1/health');

    expect(response.status).toBe(503);
    expect(response.body).toEqual({
      error: {
        code: 'SERVICE_UNAVAILABLE',
        message: 'The service is temporarily unavailable.',
      },
    });
  });
});
