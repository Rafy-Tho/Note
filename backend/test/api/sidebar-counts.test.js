import request from 'supertest';
import { describe, expect, it, vi } from 'vitest';
import { createApp } from '../../src/app/app.js';

const config = {
  nodeEnv: 'test',
  sessionCookieName: 'note_app_session',
  csrfSecret: 'csrf-test-secret',
};

function createTestApp(sidebarCountsService = { get: vi.fn() }) {
  const sessions = new Map([
    [
      'session-a',
      { userId: 'user-a', email: 'a@example.com', emailVerifiedAt: new Date() },
    ],
  ]);
  const authService = {
    async authenticateToken(token) {
      const session = sessions.get(token);
      return session ? { ...session, id: 'session-id' } : null;
    },
    csrfMatches() {
      return true;
    },
  };

  return {
    app: createApp({ authService, config, sidebarCountsService }),
    sidebarCountsService,
  };
}

describe('sidebar counts API', () => {
  it('returns authenticated user counts in the standard data envelope', async () => {
    const counts = {
      notes: 3,
      favorites: 1,
      archive: 2,
      trash: 1,
      notebooks: 1,
      tags: 1,
      notebookCounts: [{ id: 'notebook-a', count: 2 }],
      tagCounts: [{ id: 'tag-a', count: 3 }],
    };
    const { app, sidebarCountsService } = createTestApp({
      get: vi.fn().mockResolvedValue(counts),
    });

    const response = await request(app)
      .get('/api/v1/workspace/sidebar-counts')
      .set('Cookie', 'note_app_session=session-a');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ data: counts });
    expect(sidebarCountsService.get).toHaveBeenCalledWith('user-a');
  });

  it('requires an authenticated session', async () => {
    const { app, sidebarCountsService } = createTestApp();

    const response = await request(app).get('/api/v1/workspace/sidebar-counts');

    expect(response.status).toBe(401);
    expect(sidebarCountsService.get).not.toHaveBeenCalled();
  });
});
