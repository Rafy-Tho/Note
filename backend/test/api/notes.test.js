import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from '../../src/app.js';
import { AppError, notFoundError } from '../../src/common/errors.js';

const config = {
  nodeEnv: 'test',
  sessionCookieName: 'note_app_session',
  csrfSecret: 'csrf-test-secret',
};

function createNotesTestApp() {
  const sessions = new Map([
    ['session-a', { userId: 'user-a', email: 'a@example.com' }],
    ['session-b', { userId: 'user-b', email: 'b@example.com' }],
  ]);
  const notes = new Map();
  let nextId = 1;
  const present = (note) => {
    const copy = { ...note };
    delete copy.userId;
    return copy;
  };
  const service = {
    async list(userId, filters) {
      const owned = [...notes.values()].filter(
        (note) => note.userId === userId && note.state === filters.state,
      );
      return { notes: owned.map(present), total: owned.length };
    },
    async get(userId, noteId) {
      const note = notes.get(noteId);
      if (!note || note.userId !== userId) throw notFoundError();
      return present(note);
    },
    async create(userId, input) {
      const note = {
        id: `11111111-1111-4111-8111-11111111111${nextId++}`,
        userId,
        ...input,
        state: 'active',
        revision: 0,
        createdAt: '2026-09-09T00:00:00.000Z',
        updatedAt: '2026-09-09T00:00:00.000Z',
      };
      notes.set(note.id, note);
      return present(note);
    },
    async update(userId, noteId, input) {
      const note = await this.get(userId, noteId);
      if (note.revision !== input.revision)
        throw new AppError(
          409,
          'CONFLICT',
          'The note changed before your update could be saved.',
        );
      Object.assign(note, input, { revision: note.revision + 1 });
      return present(note);
    },
  };
  const authService = {
    async authenticateToken(token) {
      const session = sessions.get(token);
      return session ? { ...session, id: `id-${session.userId}` } : null;
    },
    csrfMatches() {
      return true;
    },
  };

  return createApp({
    authService,
    config,
    notesService: service,
    logger: { info() {}, error() {} },
  });
}

function userRequest(app, user, method, path) {
  const test = request(app)[method](path);
  return test.set('Cookie', `note_app_session=session-${user}`);
}

describe('notes API', () => {
  it('creates blank and populated notes and lists owned notes', async () => {
    const app = createNotesTestApp();
    const blank = await userRequest(app, 'a', 'post', '/api/v1/notes')
      .set('x-csrf-token', 'test')
      .send({});
    const populated = await userRequest(app, 'a', 'post', '/api/v1/notes')
      .set('x-csrf-token', 'test')
      .send({ title: 'Ideas', contentJson: { type: 'doc', content: [] } });

    expect(blank.status).toBe(201);
    expect(blank.body.data.title).toBe('');
    expect(populated.body.data.title).toBe('Ideas');

    const list = await userRequest(app, 'a', 'get', '/api/v1/notes');
    expect(list.status).toBe(200);
    expect(list.body.pagination).toEqual({ page: 1, limit: 20, total: 2 });
    expect(list.body.data).toHaveLength(2);
    expect(list.text).not.toContain('userId');
  });

  it('allows an owner to view and edit a note', async () => {
    const app = createNotesTestApp();
    const created = await userRequest(app, 'a', 'post', '/api/v1/notes')
      .set('x-csrf-token', 'test')
      .send({ title: 'Draft' });
    const noteId = created.body.data.id;

    const viewed = await userRequest(
      app,
      'a',
      'get',
      `/api/v1/notes/${noteId}`,
    );
    const updated = await userRequest(
      app,
      'a',
      'patch',
      `/api/v1/notes/${noteId}`,
    )
      .set('x-csrf-token', 'test')
      .send({ title: 'Published', revision: 0 });

    expect(viewed.body.data.title).toBe('Draft');
    expect(updated.body.data).toMatchObject({
      title: 'Published',
      revision: 1,
    });
  });

  it('denies cross-user access and rejects stale edits', async () => {
    const app = createNotesTestApp();
    const created = await userRequest(app, 'a', 'post', '/api/v1/notes')
      .set('x-csrf-token', 'test')
      .send({ title: 'Private' });
    const noteId = created.body.data.id;

    const foreign = await userRequest(
      app,
      'b',
      'get',
      `/api/v1/notes/${noteId}`,
    );
    const stale = await userRequest(
      app,
      'a',
      'patch',
      `/api/v1/notes/${noteId}`,
    )
      .set('x-csrf-token', 'test')
      .send({ title: 'Stale', revision: 4 });

    expect(foreign.status).toBe(404);
    expect(foreign.text).not.toContain('Private');
    expect(stale.status).toBe(409);
    expect(stale.body.error.code).toBe('CONFLICT');
  });
});
