import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from '../../src/app.js';
import { AppError, notFoundError } from '../../src/common/errors.js';

const config = {
  nodeEnv: 'test',
  sessionCookieName: 'note_app_session',
  csrfSecret: 'csrf-test-secret',
};

const ids = {
  note: '11111111-1111-4111-8111-111111111111',
  notebook: '22222222-2222-4222-8222-222222222222',
};

function createOrganizationTestApp() {
  const sessions = new Map([
    ['session-a', { userId: 'user-a', email: 'a@example.com' }],
    ['session-b', { userId: 'user-b', email: 'b@example.com' }],
  ]);
  const notes = new Map();
  const notebooks = new Map();
  let nextNote = 1;
  let nextNotebook = 1;
  const copy = (value) => ({ ...value });

  const notesService = {
    async list(userId, filters) {
      const result = [...notes.values()].filter(
        (note) => note.userId === userId && note.state === filters.state,
      );
      return { notes: result.map(copy), total: result.length };
    },
    async listTrash(userId) {
      const result = [...notes.values()].filter(
        (note) => note.userId === userId && note.state === 'trashed',
      );
      return { notes: result.map(copy), total: result.length };
    },
    async listFavorites(userId) {
      const result = [...notes.values()].filter(
        (note) => note.userId === userId && note.isFavorite,
      );
      return { notes: result.map(copy), total: result.length };
    },
    async create(userId, input) {
      const note = {
        id: `${ids.note.slice(0, -1)}${nextNote++}`,
        userId,
        ...input,
        state: 'active',
        isFavorite: false,
        revision: 0,
      };
      notes.set(note.id, note);
      return copy(note);
    },
    async get(userId, noteId) {
      const note = notes.get(noteId);
      if (!note || note.userId !== userId) throw notFoundError();
      return copy(note);
    },
    async archive(userId, noteId) {
      const note = await this.get(userId, noteId);
      if (note.state !== 'active')
        throw new AppError(409, 'INVALID_STATE_TRANSITION', 'Invalid state.');
      notes.get(noteId).state = 'archived';
      return copy(notes.get(noteId));
    },
    async unarchive(userId, noteId) {
      const note = await this.get(userId, noteId);
      if (note.state !== 'archived')
        throw new AppError(409, 'INVALID_STATE_TRANSITION', 'Invalid state.');
      notes.get(noteId).state = 'active';
      return copy(notes.get(noteId));
    },
    async favorite(userId, noteId, isFavorite) {
      const note = await this.get(userId, noteId);
      if (note.state === 'trashed')
        throw new AppError(409, 'INVALID_STATE_TRANSITION', 'Invalid state.');
      notes.get(noteId).isFavorite = isFavorite;
      return copy(notes.get(noteId));
    },
    async permanentlyDelete(userId, noteId) {
      const note = await this.get(userId, noteId);
      if (note.state !== 'trashed') throw notFoundError();
      notes.delete(noteId);
    },
    async assignNotebook(userId, noteId, notebookId) {
      const note = await this.get(userId, noteId);
      if (note.state === 'trashed')
        throw new AppError(409, 'INVALID_STATE_TRANSITION', 'Invalid state.');
      if (notebookId) {
        const notebook = notebooks.get(notebookId);
        if (!notebook || notebook.userId !== userId) throw notFoundError();
      }
      notes.get(noteId).notebookId = notebookId;
      return copy(notes.get(noteId));
    },
    async trash(userId, noteId) {
      const note = await this.get(userId, noteId);
      if (note.state === 'trashed')
        throw new AppError(409, 'INVALID_STATE_TRANSITION', 'Invalid state.');
      notes.get(noteId).state = 'trashed';
      return copy(notes.get(noteId));
    },
    async restore(userId, noteId) {
      const note = await this.get(userId, noteId);
      if (note.state !== 'trashed')
        throw new AppError(409, 'INVALID_STATE_TRANSITION', 'Invalid state.');
      notes.get(noteId).state = 'active';
      return copy(notes.get(noteId));
    },
  };

  const notebooksService = {
    async list(userId) {
      const result = [...notebooks.values()].filter(
        (item) => item.userId === userId,
      );
      return { notebooks: result.map(copy), total: result.length };
    },
    async create(userId, input) {
      if (
        [...notebooks.values()].some(
          (item) =>
            item.userId === userId &&
            item.normalizedName === input.normalizedName,
        )
      )
        throw new AppError(
          409,
          'DUPLICATE_NOTEBOOK',
          'A notebook with that name already exists.',
        );
      const notebook = {
        id: `${ids.notebook.slice(0, -1)}${nextNotebook++}`,
        userId,
        ...input,
      };
      notebooks.set(notebook.id, notebook);
      return copy(notebook);
    },
    async rename(userId, notebookId, input) {
      const notebook = notebooks.get(notebookId);
      if (!notebook || notebook.userId !== userId) throw notFoundError();
      notebook.name = input.name;
      notebook.normalizedName = input.normalizedName;
      return copy(notebook);
    },
    async delete(userId, notebookId) {
      const notebook = notebooks.get(notebookId);
      if (!notebook || notebook.userId !== userId) throw notFoundError();
      for (const note of notes.values())
        if (note.notebookId === notebookId) note.notebookId = null;
      notebooks.delete(notebookId);
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

  return {
    app: createApp({
      authService,
      config,
      notesService,
      notebooksService,
      logger: { info() {}, error() {} },
    }),
    notesService,
  };
}

function userRequest(app, user, method, path) {
  return request(app)
    [method](path)
    .set('Cookie', `note_app_session=session-${user}`);
}

describe('organization and recovery API', () => {
  it('creates, moves, renames, and deletes owned notebooks safely', async () => {
    const { app } = createOrganizationTestApp();
    const created = await userRequest(app, 'a', 'post', '/api/v1/notebooks')
      .set('x-csrf-token', 'test')
      .send({ name: '  Project   Alpha ' });
    const note = await userRequest(app, 'a', 'post', '/api/v1/notes')
      .set('x-csrf-token', 'test')
      .send({ title: 'Owned' });
    const moved = await userRequest(
      app,
      'a',
      'put',
      `/api/v1/notes/${note.body.data.id}/notebook`,
    )
      .set('x-csrf-token', 'test')
      .send({ notebookId: created.body.data.id });
    const renamed = await userRequest(
      app,
      'a',
      'patch',
      `/api/v1/notebooks/${created.body.data.id}`,
    )
      .set('x-csrf-token', 'test')
      .send({ name: 'Renamed' });
    const deleted = await userRequest(
      app,
      'a',
      'delete',
      `/api/v1/notebooks/${created.body.data.id}`,
    ).set('x-csrf-token', 'test');

    expect(created.body.data.name).toBe('Project Alpha');
    expect(moved.body.data.notebookId).toBe(created.body.data.id);
    expect(renamed.body.data.name).toBe('Renamed');
    expect(deleted.status).toBe(204);
  });

  it('protects favorites, archive, and permanent deletion by owner and state', async () => {
    const { app } = createOrganizationTestApp();
    const created = await userRequest(app, 'a', 'post', '/api/v1/notes')
      .set('x-csrf-token', 'test')
      .send({ title: 'Private' });
    const noteId = created.body.data.id;
    const foreignFavorite = await userRequest(
      app,
      'b',
      'post',
      `/api/v1/notes/${noteId}/favorite`,
    ).set('x-csrf-token', 'test');
    const favorite = await userRequest(
      app,
      'a',
      'post',
      `/api/v1/notes/${noteId}/favorite`,
    ).set('x-csrf-token', 'test');
    const archive = await userRequest(
      app,
      'a',
      'post',
      `/api/v1/notes/${noteId}/archive`,
    ).set('x-csrf-token', 'test');
    const prematureDelete = await userRequest(
      app,
      'a',
      'delete',
      `/api/v1/notes/${noteId}/permanent`,
    ).set('x-csrf-token', 'test');
    await userRequest(app, 'a', 'delete', `/api/v1/notes/${noteId}`).set(
      'x-csrf-token',
      'test',
    );
    const permanentDelete = await userRequest(
      app,
      'a',
      'delete',
      `/api/v1/notes/${noteId}/permanent`,
    ).set('x-csrf-token', 'test');

    expect(foreignFavorite.status).toBe(404);
    expect(favorite.body.data.isFavorite).toBe(true);
    expect(archive.body.data.state).toBe('archived');
    expect(prematureDelete.status).toBe(404);
    expect(permanentDelete.status).toBe(204);
  });
});
