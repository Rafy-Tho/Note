import request from 'supertest';
import { describe, expect, it, vi } from 'vitest';
import { createApp } from '../../src/app/app.js';

const baseConfig = {
  nodeEnv: 'test',
  sessionCookieName: 'note_app_session',
  csrfSecret: 'csrf-test-secret',
  corsOrigin: 'http://frontend.test',
  corsOrigins: ['http://frontend.test'],
  requireSameOriginHeaders: false,
  apiRateLimitMax: 300,
  authRateLimitMax: 10,
};

const noteId = '11111111-1111-4111-8111-111111111111';
const tagId = '22222222-2222-4222-8222-222222222222';
const notebookId = '33333333-3333-4333-8333-333333333333';

const stateChangingEndpoints = [
  { method: 'post', path: '/api/v1/auth/register' },
  { method: 'post', path: '/api/v1/auth/login' },
  { method: 'post', path: '/api/v1/auth/email/verify' },
  { method: 'post', path: '/api/v1/auth/email/verification/resend' },
  { method: 'post', path: '/api/v1/auth/password/reset/request' },
  { method: 'post', path: '/api/v1/auth/password/reset/confirm' },
  { method: 'post', path: '/api/v1/auth/identities/google/link' },
  { method: 'delete', path: '/api/v1/auth/identities/google' },
  { method: 'post', path: '/api/v1/auth/logout' },
  { method: 'post', path: '/api/v1/notes' },
  { method: 'patch', path: `/api/v1/notes/${noteId}` },
  { method: 'delete', path: `/api/v1/notes/${noteId}` },
  { method: 'post', path: `/api/v1/notes/${noteId}/restore` },
  { method: 'post', path: `/api/v1/notes/${noteId}/archive` },
  { method: 'post', path: `/api/v1/notes/${noteId}/unarchive` },
  { method: 'post', path: `/api/v1/notes/${noteId}/favorite` },
  { method: 'delete', path: `/api/v1/notes/${noteId}/favorite` },
  { method: 'delete', path: `/api/v1/notes/${noteId}/permanent` },
  { method: 'put', path: `/api/v1/notes/${noteId}/notebook` },
  { method: 'post', path: '/api/v1/notebooks' },
  { method: 'patch', path: `/api/v1/notebooks/${notebookId}` },
  { method: 'delete', path: `/api/v1/notebooks/${notebookId}` },
  { method: 'post', path: '/api/v1/tags' },
  { method: 'patch', path: `/api/v1/tags/${tagId}` },
  { method: 'delete', path: `/api/v1/tags/${tagId}` },
  { method: 'post', path: `/api/v1/notes/${noteId}/tags` },
  { method: 'delete', path: `/api/v1/notes/${noteId}/tags/${tagId}` },
];

const publicMutationPaths = new Set([
  '/api/v1/auth/register',
  '/api/v1/auth/login',
  '/api/v1/auth/email/verify',
  '/api/v1/auth/email/verification/resend',
  '/api/v1/auth/password/reset/request',
  '/api/v1/auth/password/reset/confirm',
]);

const protectedMutationEndpoints = stateChangingEndpoints.filter(
  ({ path }) => !publicMutationPaths.has(path),
);

function createSecurityApp(overrides = {}) {
  const config = { ...baseConfig, ...overrides.config };
  const logger = overrides.logger ?? { info: vi.fn(), error: vi.fn() };
  const app = createApp({
    config,
    logger,
    authService: {
      async authenticateToken() {
        return null;
      },
    },
    databaseCheck: async () => {},
    configureRoutes: (configuredApp) => {
      configuredApp.get('/api/v1/security-test', (request, response) => {
        response.json({ data: { query: request.query } });
      });
      configuredApp.post('/api/v1/security-test', (request, response) => {
        response.json({ data: { body: request.body } });
      });
      configuredApp.get('/api/v1/security-test/large', (_request, response) => {
        response.json({ data: { value: 'x'.repeat(5000) } });
      });
    },
  });

  return { app, logger };
}

function createMutationSecurityApp() {
  const authService = {
    async authenticateToken(token) {
      if (token !== 'session-token') return null;
      return {
        id: 'session-id',
        userId: 'user-id',
        email: 'user@example.com',
        emailVerifiedAt: new Date(),
      };
    },
    csrfMatches() {
      return false;
    },
  };

  return createApp({
    config: {
      ...baseConfig,
      requireSameOriginHeaders: true,
    },
    authService,
    logger: { info: vi.fn(), error: vi.fn() },
  });
}

function sendMutation(app, { method, path }) {
  return request(app)[method](path);
}

describe('backend security middleware', () => {
  it('sets security headers and does not expose Express', async () => {
    const { app } = createSecurityApp();

    const response = await request(app).get('/api/v1/health');

    expect(response.status).toBe(200);
    expect(response.headers['x-powered-by']).toBeUndefined();
    expect(response.headers['x-content-type-options']).toBe('nosniff');
    expect(response.headers['x-frame-options']).toBe('SAMEORIGIN');
    expect(response.headers['referrer-policy']).toBe('no-referrer');
  });

  it('warns when production uses process-local rate-limit storage', () => {
    const logger = { info: vi.fn(), error: vi.fn(), warn: vi.fn() };
    createSecurityApp({
      config: { nodeEnv: 'production' },
      logger,
    });

    expect(logger.warn).toHaveBeenCalledWith(
      'Using process-local rate-limit storage.',
      { backendInstanceCount: 1 },
    );
  });

  it('rejects production multi-instance memory rate limiting at startup', () => {
    expect(() =>
      createSecurityApp({
        config: { nodeEnv: 'production', backendInstanceCount: 2 },
      }),
    ).toThrow('Invalid rate-limit configuration.');
  });

  it('rejects shared rate-limit mode without store adapters', () => {
    expect(() =>
      createSecurityApp({
        config: { rateLimitStoreMode: 'shared' },
      }),
    ).toThrow('Invalid rate-limit configuration.');

    try {
      createSecurityApp({
        config: { rateLimitStoreMode: 'shared' },
      });
    } catch (error) {
      expect(error.fields.RATE_LIMIT_STORE).toBe(
        'Shared rate-limit mode requires separate api and auth store adapters.',
      );
    }
  });

  it('preserves a numeric trusted-proxy hop count in Express', () => {
    const { app } = createSecurityApp({ config: { trustProxy: 2 } });

    expect(app.get('trust proxy')).toBe(2);
  });

  it('allows configured credentialed CORS preflight requests', async () => {
    const { app } = createSecurityApp();

    const response = await request(app)
      .options('/api/v1/security-test')
      .set('Origin', 'http://frontend.test')
      .set('Access-Control-Request-Method', 'POST')
      .set('Access-Control-Request-Headers', 'content-type,x-csrf-token');

    expect(response.status).toBe(204);
    expect(response.headers['access-control-allow-origin']).toBe(
      'http://frontend.test',
    );
    expect(response.headers['access-control-allow-credentials']).toBe('true');
  });

  it('allows configured browser Origin requests with credentials', async () => {
    const { app } = createSecurityApp();

    const response = await request(app)
      .get('/api/v1/security-test')
      .set('Origin', 'http://frontend.test');

    expect(response.status).toBe(200);
    expect(response.headers['access-control-allow-origin']).toBe(
      'http://frontend.test',
    );
    expect(response.headers['access-control-allow-credentials']).toBe('true');
  });

  it('does not emit credentialed CORS headers without Origin', async () => {
    const { app } = createSecurityApp();

    const response = await request(app).get('/api/v1/security-test');

    expect(response.status).toBe(200);
    expect(response.headers['access-control-allow-origin']).toBeUndefined();
    expect(
      response.headers['access-control-allow-credentials'],
    ).toBeUndefined();
  });

  it('does not treat an Origin-less preflight as allowed CORS', async () => {
    const { app } = createSecurityApp();

    const response = await request(app)
      .options('/api/v1/security-test')
      .set('Access-Control-Request-Method', 'POST');

    expect(response.status).toBe(404);
    expect(response.headers['access-control-allow-origin']).toBeUndefined();
    expect(
      response.headers['access-control-allow-credentials'],
    ).toBeUndefined();
  });

  it('rejects unsafe requests from an unconfigured origin', async () => {
    const { app } = createSecurityApp();

    const response = await request(app)
      .post('/api/v1/security-test')
      .set('Origin', 'http://attacker.test')
      .send({ value: 'blocked' });

    expect(response.status).toBe(403);
    expect(response.body.error.code).toBe('ORIGIN_INVALID');
    expect(response.headers['access-control-allow-origin']).toBeUndefined();
  });

  it('rejects unsafe requests with no origin or referer in strict mode', async () => {
    const { app } = createSecurityApp({
      config: { requireSameOriginHeaders: true },
    });

    const response = await request(app)
      .post('/api/v1/security-test')
      .send({ value: 'missing-origin' });

    expect(response.status).toBe(403);
    expect(response.body.error.code).toBe('ORIGIN_INVALID');
  });

  it('accepts an allowed referer when Origin is unavailable', async () => {
    const { app } = createSecurityApp({
      config: { requireSameOriginHeaders: true },
    });

    const response = await request(app)
      .post('/api/v1/security-test')
      .set('Referer', 'http://frontend.test/form')
      .send({ value: 'allowed-referer' });

    expect(response.status).toBe(200);
    expect(response.body.data.body).toEqual({ value: 'allowed-referer' });
  });

  it.each(stateChangingEndpoints)(
    'requires an origin or referer for $method $path',
    async (endpoint) => {
      const app = createMutationSecurityApp();
      const response = await sendMutation(app, endpoint);

      expect(response.status).toBe(403);
      expect(response.body.error.code).toBe('ORIGIN_INVALID');
    },
  );

  it.each(protectedMutationEndpoints)(
    'requires CSRF for protected $method $path',
    async (endpoint) => {
      const app = createMutationSecurityApp();
      const response = await sendMutation(app, endpoint)
        .set('Origin', 'http://frontend.test')
        .set('Cookie', 'note_app_session=session-token');

      expect(response.status).toBe(403);
      expect(response.body.error.code).toBe('CSRF_INVALID');
    },
  );

  it('allows repeated scalar query values for route handling', async () => {
    const { app } = createSecurityApp();

    const response = await request(app).get(
      '/api/v1/security-test?page=1&page=2',
    );

    expect(response.status).toBe(200);
    expect(response.body.data.query.page).toEqual(['1', '2']);
  });

  it('rejects nested query parameters', async () => {
    const { app } = createSecurityApp();

    const response = await request(app).get(
      '/api/v1/security-test?filters[status]=active',
    );

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('PARAMETER_POLLUTION');
  });

  it('returns a safe error for oversized JSON bodies', async () => {
    const { app } = createSecurityApp({
      config: { requestBodyLimit: '10b' },
    });

    const response = await request(app)
      .post('/api/v1/security-test')
      .send({ value: 'this body is too large' });

    expect(response.status).toBe(413);
    expect(response.body).toEqual({
      error: {
        code: 'PAYLOAD_TOO_LARGE',
        message: 'The request body is too large.',
      },
    });
  });

  it('shares the API rate limit across requests', async () => {
    const { app } = createSecurityApp({
      config: { apiRateLimitMax: 1 },
    });

    expect((await request(app).get('/api/v1/security-test')).status).toBe(200);
    const limited = await request(app).get('/api/v1/security-test');

    expect(limited.status).toBe(429);
    expect(limited.body.error.code).toBe('RATE_LIMITED');
  });

  it('does not log OAuth query values and replaces unsafe request IDs', async () => {
    const logger = { info: vi.fn(), error: vi.fn() };
    const { app } = createSecurityApp({ logger });
    const oversizedRequestId = 'x'.repeat(101);

    const response = await request(app)
      .get('/api/v1/security-test?code=private-code&state=private-state')
      .set('x-request-id', oversizedRequestId);

    expect(response.status).toBe(200);
    expect(response.headers['x-request-id']).not.toBe(oversizedRequestId);
    expect(logger.info).toHaveBeenCalledWith(
      'HTTP request',
      expect.objectContaining({ path: '/api/v1/security-test' }),
    );
    expect(JSON.stringify(logger.info.mock.calls)).not.toContain(
      'private-code',
    );
    expect(JSON.stringify(logger.info.mock.calls)).not.toContain(
      'private-state',
    );
  });

  it('compresses large non-authentication responses', async () => {
    const { app } = createSecurityApp();

    const response = await request(app)
      .get('/api/v1/security-test/large')
      .set('Accept-Encoding', 'gzip');

    expect(response.status).toBe(200);
    expect(response.headers['content-encoding']).toBe('gzip');
  });
});
