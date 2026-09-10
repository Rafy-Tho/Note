import request from 'supertest';
import { describe, expect, it, vi } from 'vitest';
import { createApp } from '../../src/app.js';
import {
  createSessionMiddleware,
  requireAuthentication,
  requireVerifiedEmail,
} from '../../src/modules/auth/auth.middleware.js';

const config = {
  nodeEnv: 'test',
  sessionCookieName: 'note_app_session',
  csrfSecret: 'csrf-test-secret',
};

function createFakeAuthService(verified = true) {
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
    async verifyEmail() {
      return {
        id: 'user-1',
        email: 'user@example.com',
        emailVerified: true,
      };
    },
    async requestEmailVerification() {
      return { accepted: true };
    },
    async requestPasswordReset() {
      return { accepted: true };
    },
    async resetPassword() {
      return {
        id: 'user-1',
        email: 'user@example.com',
        emailVerified: true,
      };
    },
    async startGoogleSignIn() {
      return 'https://accounts.google.com/o/oauth2/v2/auth?state=test-state';
    },
    async completeGoogleSignIn() {
      return {
        token: 'session-user-1',
        user: {
          id: 'user-1',
          email: 'user@example.com',
          emailVerified: true,
        },
      };
    },
    async startFacebookSignIn() {
      return 'https://www.facebook.com/v20.0/dialog/oauth?state=test-state';
    },
    async completeFacebookSignIn() {
      return {
        token: 'session-user-1',
        user: {
          id: 'user-1',
          email: 'user@example.com',
          emailVerified: true,
        },
      };
    },
    async listLinkedProviders() {
      return [{ provider: 'google', created_at: '2026-09-10T00:00:00Z' }];
    },
    async startProviderLink() {
      return 'https://accounts.google.com/o/oauth2/v2/auth?state=link-state';
    },
    async completeProviderLink({ provider }) {
      return { provider };
    },
    async unlinkProvider({ provider }) {
      return { provider };
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
        emailVerifiedAt: verified ? new Date() : null,
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
        emailVerifiedAt: session.emailVerifiedAt,
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
          requireVerifiedEmail,
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
      emailVerified: false,
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

  it('requires email verification before protected access', async () => {
    const { app } = createTestApp(createFakeAuthService(false));
    const agent = request.agent(app);
    await agent
      .post('/api/v1/auth/register')
      .send({ email: 'user@example.com', password: 'correct-password' });
    await agent
      .post('/api/v1/auth/login')
      .send({ email: 'user@example.com', password: 'correct-password' });

    const response = await agent.get('/api/v1/protected');

    expect(response.status).toBe(403);
    expect(response.body.error.code).toBe('EMAIL_VERIFICATION_REQUIRED');
  });

  it('exposes verification and resend endpoints without session tokens', async () => {
    const { app } = createTestApp();

    const resend = await request(app)
      .post('/api/v1/auth/email/verification/resend')
      .send({ email: 'user@example.com' });
    const verify = await request(app)
      .post('/api/v1/auth/email/verify')
      .send({ token: 'verification-token-value' });

    expect(resend.status).toBe(200);
    expect(resend.body).toEqual({ data: { accepted: true } });
    expect(verify.status).toBe(200);
    expect(verify.body.data.user.emailVerified).toBe(true);
    expect(verify.headers['set-cookie']).toBeUndefined();
  });

  it('exposes generic password reset endpoints without creating a session', async () => {
    const { app } = createTestApp();

    const requestReset = await request(app)
      .post('/api/v1/auth/password/reset/request')
      .send({ email: 'user@example.com' });
    const confirmReset = await request(app)
      .post('/api/v1/auth/password/reset/confirm')
      .send({
        token: 'password-reset-token-value',
        password: 'new-correct-password',
      });

    expect(requestReset.status).toBe(200);
    expect(requestReset.body).toEqual({ data: { accepted: true } });
    expect(confirmReset.status).toBe(200);
    expect(confirmReset.body.data.user.emailVerified).toBe(true);
    expect(confirmReset.headers['set-cookie']).toBeUndefined();
  });

  it('starts Google sign-in with a browser binding and creates the normal session', async () => {
    const { app } = createTestApp();
    const agent = request.agent(app);

    const start = await agent.get('/api/v1/auth/google/start');
    const callback = await agent
      .get('/api/v1/auth/google/callback')
      .query({ code: 'authorization-code', state: 'test-state' });

    expect(start.status).toBe(302);
    expect(start.headers.location).toContain('accounts.google.com');
    expect(start.headers['set-cookie']).toEqual(
      expect.arrayContaining([
        expect.stringContaining('note_app_oauth_binding'),
      ]),
    );
    expect(callback.status).toBe(200);
    expect(callback.body.data.authenticated).toBe(true);
    expect(callback.body.data).not.toHaveProperty('token');
  });

  it('starts Facebook sign-in with a browser binding and creates the normal session', async () => {
    const { app } = createTestApp();
    const agent = request.agent(app);

    const start = await agent.get('/api/v1/auth/facebook/start');
    const callback = await agent
      .get('/api/v1/auth/facebook/callback')
      .query({ code: 'authorization-code', state: 'test-state' });

    expect(start.status).toBe(302);
    expect(start.headers.location).toContain('facebook.com');
    expect(callback.status).toBe(200);
    expect(callback.body.data.authenticated).toBe(true);
    expect(callback.body.data).not.toHaveProperty('token');
  });

  it('lists, links, and unlinks providers from an authenticated session', async () => {
    const { app } = createTestApp();
    const agent = request.agent(app);
    await agent
      .post('/api/v1/auth/register')
      .send({ email: 'user@example.com', password: 'correct-password' });
    const login = await agent
      .post('/api/v1/auth/login')
      .send({ email: 'user@example.com', password: 'correct-password' });

    const identities = await agent.get('/api/v1/auth/identities');
    const start = await agent.get('/api/v1/auth/google/link/start');
    const callback = await agent
      .get('/api/v1/auth/google/link/callback')
      .query({ code: 'authorization-code', state: 'link-state' });
    const unlink = await agent
      .delete('/api/v1/auth/identities/google')
      .set('x-csrf-token', login.body.data.csrfToken);

    expect(identities.status).toBe(200);
    expect(identities.body.data.identities[0].provider).toBe('google');
    expect(start.status).toBe(302);
    expect(callback.body.data).toEqual({ provider: 'google' });
    expect(unlink.body.data).toEqual({ provider: 'google' });
  });
});
