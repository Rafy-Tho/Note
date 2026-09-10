import request from 'supertest';
import { describe, expect, it, vi } from 'vitest';
import { createApp } from '../../src/app/app.js';

function silentLogger() {
  return { info: vi.fn(), error: vi.fn() };
}

describe('backend foundation', () => {
  it('returns a standard validation error for malformed JSON', async () => {
    const app = createApp({ logger: silentLogger() });

    const response = await request(app)
      .post('/api/v1/test')
      .set('content-type', 'application/json')
      .send('{');

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'The request is invalid.',
        fields: { body: 'Malformed JSON.' },
      },
    });
  });

  it('returns a safe not-found error for unknown routes', async () => {
    const app = createApp({ logger: silentLogger() });

    const response = await request(app).get('/api/v1/unknown');

    expect(response.status).toBe(404);
    expect(response.body).toEqual({
      error: {
        code: 'NOT_FOUND',
        message: 'The requested resource was not found.',
      },
    });
  });

  it('does not expose unexpected error details', async () => {
    const app = createApp({
      logger: silentLogger(),
      configureRoutes: (configuredApp) => {
        configuredApp.get('/api/v1/test-error', () => {
          throw new Error('private stack detail');
        });
      },
    });

    const response = await request(app).get('/api/v1/test-error');

    expect(response.status).toBe(500);
    expect(response.body).toEqual({
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An unexpected error occurred.',
      },
    });
    expect(response.text).not.toContain('private stack detail');
  });

  it('adds a request ID to responses and logs', async () => {
    const logger = silentLogger();
    const app = createApp({ logger, databaseCheck: async () => {} });

    const response = await request(app)
      .get('/api/v1/health')
      .set('x-request-id', 'test-request-id');

    expect(response.headers['x-request-id']).toBe('test-request-id');
    expect(logger.info).toHaveBeenCalledWith(
      'HTTP request',
      expect.objectContaining({ requestId: 'test-request-id', status: 200 }),
    );
  });
});
