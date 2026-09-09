import request from 'supertest';
import { describe, expect, it, vi } from 'vitest';
import { createApp } from '../../src/app.js';
import {
  createSessionMiddleware,
  requireAuthentication,
} from '../../src/modules/auth/auth.middleware.js';

const config = {
  nodeEnv: 'test',
  sessionCookieName: 'note_app_session',
  csrfSecret: 'csrf-test-secret',
};

function createFakeAuthService() {
  const sessions = new Map();
  const users = new Map();
  let nextUserId = 1;

  return {
    async register({ email }) {
      if (users.has(email)) {
        const error = new Error('duplicate');
        error.code = '23505';
        throw error;
      }
      const user = { id: `user-${nextUserId++}`, email };
      users.set(email, user);
      return user;
    },
    async verifyCredentials({ email, password }) {
      if (password !== 'correct-password') return null;
      const user = users.get(email);
      if (!user) return null;
      return { ...user, password_hash: 'not-returned' };
    },
    async createSession(userId) {
      const token = `session-${userId}`;
      sessions.set(token, {
        userId,
        email: [...users.values()].find((user) => user.id === userId).email,
      });
      return { token, session: {} };
    },
    async authenticateToken(token) {
      const session = sessions.get(token);
      if (!session) return null;
      return {
        id: 'session-id',
        userId: session.userId,
        email: session.email,
        token,
        csrfToken: 'unused',
      };
    },
    async revokeSession(token) {
      sessions.delete(token);
    },
    csrfToken: vi.fn((token, secret) => `${secret}:${token}`),
    csrfMatches(token, csrf, secret) {
      return csrf === `${secret}:${token}`;
    },
  };
}

function createTestApp(authService = createFakeAuthService()) {
  return {
    app: createApp({
      authService,
      config,
      logger: { info: vi.fn(), error: vi.fn() },
      configureRoutes: (app) => {
        app.get(
          '/api/v1/protected',
          createSessionMiddleware({
            authService,
            cookieName: config.sessionCookieName,
          }),
          requireAuthentication,
          (request, response) =>
            response.json({ data: { userId: request.auth.userId } }),
        );
      },
    }),
    authService,
  };
}

describe('authentication API', () => {
  it('registers with normalized email and does not create a session', async () => {
    const { app } = createTestApp();
    const response = await request(app).post('/api/v1/auth/register').send({
      email: '  User@Example.COM ',
      password: 'correct-password',
    });

    expect(response.status).toBe(201);
    expect(response.body).toEqual({
      data: { user: { id: 'user-1', email: 'user@example.com' } },
    });
    expect(response.headers['set-cookie']).toBeUndefined();
  });

  it('uses a generic response for invalid login credentials', async () => {
    const { app } = createTestApp();
    await request(app)
      .post('/api/v1/auth/register')
      .send({ email: 'user@example.com', password: 'correct-password' });
    const response = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'user@example.com', password: 'wrong-password' });

    expect(response.status).toBe(401);
    expect(response.body).toEqual({
      error: {
        code: 'AUTHENTICATION_FAILED',
        message: 'Invalid email or password.',
      },
    });
  });

  it('establishes a protected session and revokes it on logout', async () => {
    const { app } = createTestApp();
    await request(app)
      .post('/api/v1/auth/register')
      .send({ email: 'user@example.com', password: 'correct-password' });
    const agent = request.agent(app);
    const login = await agent
      .post('/api/v1/auth/login')
      .send({ email: 'user@example.com', password: 'correct-password' });
    const csrfToken = login.body.data.csrfToken;

    expect(login.status).toBe(200);
    expect(login.body.data.user).toEqual({
      id: 'user-1',
      email: 'user@example.com',
    });
    expect(login.body.data).not.toHaveProperty('token');
    expect((await agent.get('/api/v1/protected')).body).toEqual({
      data: { userId: 'user-1' },
    });

    const logout = await agent
      .post('/api/v1/auth/logout')
      .set('x-csrf-token', csrfToken);
    expect(logout.status).toBe(204);
    expect((await agent.get('/api/v1/protected')).status).toBe(401);
  });

  it('rejects state-changing requests without a valid CSRF token', async () => {
    const { app } = createTestApp();
    await request(app)
      .post('/api/v1/auth/register')
      .send({ email: 'user@example.com', password: 'correct-password' });
    const agent = request.agent(app);
    await agent
      .post('/api/v1/auth/login')
      .send({ email: 'user@example.com', password: 'correct-password' });

    const response = await agent.post('/api/v1/auth/logout');
    expect(response.status).toBe(403);
    expect(response.body.error.code).toBe('CSRF_INVALID');
  });

  it('returns unauthenticated session state without exposing credentials', async () => {
    const { app } = createTestApp();
    const response = await request(app).get('/api/v1/auth/session');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      data: { authenticated: false, user: null, csrfToken: null },
    });
  });
});
