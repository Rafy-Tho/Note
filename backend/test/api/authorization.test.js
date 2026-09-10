import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from '../../src/app.js';
import {
  assertOwnedResource,
  createOwnedResourceLoader,
  getAuthenticatedUserId,
} from '../../src/modules/authorization/authorization.js';
import { createProtectedRouter } from '../../src/modules/auth/auth.middleware.js';

const config = {
  nodeEnv: 'test',
  sessionCookieName: 'note_app_session',
  csrfSecret: 'csrf-test-secret',
};

function createAuthorizationTestApp() {
  const sessions = new Map([
    [
      'session-user-a',
      { userId: 'user-a', email: 'a@example.com', emailVerifiedAt: new Date() },
    ],
    [
      'session-user-b',
      { userId: 'user-b', email: 'b@example.com', emailVerifiedAt: new Date() },
    ],
  ]);
  const notes = new Map([
    ['note-a', { id: 'note-a', user_id: 'user-a', title: 'A private note' }],
    ['note-b', { id: 'note-b', user_id: 'user-b', title: 'B private note' }],
  ]);
  const authService = {
    async authenticateToken(token) {
      const session = sessions.get(token);
      return session ? { ...session, id: `id-${session.userId}` } : null;
    },
    csrfMatches() {
      return true;
    },
  };
  const loadOwnedNote = createOwnedResourceLoader(async (id, userId) => {
    const note = notes.get(id);
    return note?.user_id === userId ? note : null;
  });
  const router = createProtectedRouter({
    authService,
    cookieName: config.sessionCookieName,
    csrfSecret: config.csrfSecret,
  });

  router.get('/notes/:noteId', async (request, response) => {
    const userId = getAuthenticatedUserId(request);
    const note = await loadOwnedNote(request.params.noteId, userId);
    response.json({ data: note });
  });
  router.patch('/notes/:noteId', async (request, response) => {
    const userId = getAuthenticatedUserId(request);
    const note = notes.get(request.params.noteId);
    assertOwnedResource(note, userId);
    note.title = request.body.title;
    response.json({ data: note });
  });

  return createApp({
    authService,
    config,
    logger: { info() {}, error() {} },
    configureRoutes: (app) => app.use('/api/v1/test', router),
  });
}

describe('authorization API foundation', () => {
  it('denies unauthenticated access to protected routers', async () => {
    const response = await request(createAuthorizationTestApp()).get(
      '/api/v1/test/notes/note-a',
    );

    expect(response.status).toBe(401);
    expect(response.body).toEqual({
      error: {
        code: 'AUTHENTICATION_REQUIRED',
        message: 'Authentication is required.',
      },
    });
  });

  it('does not let one user read another user resource', async () => {
    const response = await request(createAuthorizationTestApp())
      .get('/api/v1/test/notes/note-b')
      .set('Cookie', 'note_app_session=session-user-a');

    expect(response.status).toBe(404);
    expect(response.body).toEqual({
      error: {
        code: 'NOT_FOUND',
        message: 'The requested resource was not found.',
      },
    });
    expect(response.text).not.toContain('B private note');
  });

  it('does not let one user modify another user resource', async () => {
    const app = createAuthorizationTestApp();
    const response = await request(app)
      .patch('/api/v1/test/notes/note-b')
      .set('Cookie', 'note_app_session=session-user-a')
      .set('x-csrf-token', 'test-token')
      .send({ title: 'overwritten' });

    expect(response.status).toBe(404);
    expect(response.text).not.toContain('overwritten');

    const ownerResponse = await request(app)
      .get('/api/v1/test/notes/note-b')
      .set('Cookie', 'note_app_session=session-user-b');
    expect(ownerResponse.body.data.title).toBe('B private note');
  });

  it('returns the same safe response for missing and inaccessible resources', async () => {
    const app = createAuthorizationTestApp();
    const headers = { Cookie: 'note_app_session=session-user-a' };
    const [missing, foreign] = await Promise.all([
      request(app).get('/api/v1/test/notes/missing').set(headers),
      request(app).get('/api/v1/test/notes/note-b').set(headers),
    ]);

    expect(missing.status).toBe(404);
    expect(foreign.status).toBe(404);
    expect(missing.body).toEqual(foreign.body);
  });
});
