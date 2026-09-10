import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from '../../src/app/app.js';
import { AppError, notFoundError } from '../../src/common/errors/errors.js';

const config = {
  nodeEnv: 'test',
  sessionCookieName: 'note_app_session',
  csrfSecret: 'csrf-test-secret',
};

function createNotesTestApp() {
  const sessions = new Map([
    [
      'session-a',
      { userId: 'user-a', email: 'a@example.com', emailVerifiedAt: new Date() },
    ],
    [
      'session-b',
      { userId: 'user-b', email: 'b@example.com', emailVerifiedAt: new Date() },
    ],
  ]);
  const notes = new Map();
  const tags = new Map();
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
    async listTrash(userId, pagination) {
      const owned = [...notes.values()].filter(
        (note) => note.userId === userId && note.state === 'trashed',
      );
      return { notes: owned.map(present), total: owned.length, pagination };
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
        tags: [],
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
    async trash(userId, noteId) {
      const note = notes.get(noteId);
      if (!note || note.userId !== userId) throw notFoundError();
      if (!['active', 'archived'].includes(note.state))
        throw new AppError(
          409,
          'INVALID_STATE_TRANSITION',
          'The resource is not available for this operation.',
        );
      note.restoreState = note.state;
      note.state = 'trashed';
      note.trashedAt = '2026-09-09T00:01:00.000Z';
      return present(note);
    },
    async restore(userId, noteId) {
      const note = notes.get(noteId);
      if (!note || note.userId !== userId) throw notFoundError();
      if (note.state !== 'trashed')
        throw new AppError(
          409,
          'INVALID_STATE_TRANSITION',
          'The resource is not available for this operation.',
        );
      note.state = note.restoreState ?? 'active';
      note.restoreState = null;
      note.trashedAt = null;
      return present(note);
    },
  };
  const tagsService = {
    async list(userId, pagination) {
      const owned = [...tags.values()].filter((tag) => tag.userId === userId);
      return { tags: owned.map(present), total: owned.length, pagination };
    },
    async create(userId, input) {
      if (
        [...tags.values()].some(
          (tag) =>
            tag.userId === userId &&
            tag.normalizedName === input.normalizedName,
        )
      )
        throw new AppError(
          409,
          'DUPLICATE_TAG',
          'A tag with that name already exists.',
        );
      const tag = {
        id: `22222222-2222-4222-8222-22222222222${tags.size + 1}`,
        userId,
        ...input,
        createdAt: '2026-09-09T00:00:00.000Z',
      };
      tags.set(tag.id, tag);
      return present(tag);
    },
    async assign(userId, noteId, tagId) {
      const note = notes.get(noteId);
      const tag = tags.get(tagId);
      if (!note || note.userId !== userId || note.state === 'trashed')
        throw notFoundError();
      if (!tag || tag.userId !== userId) throw notFoundError();
      if (!note.tags.some((item) => item.id === tag.id))
        note.tags.push(present(tag));
      note.searchableText =
        `${note.title} ${note.tags.map((item) => item.name).join(' ')}`.trim();
      return { tag: present(tag), tags: note.tags };
    },
    async remove(userId, noteId, tagId) {
      const note = notes.get(noteId);
      const tag = tags.get(tagId);
      if (!note || note.userId !== userId || !tag || tag.userId !== userId)
        throw notFoundError();
      note.tags = note.tags.filter((item) => item.id !== tagId);
      note.searchableText =
        `${note.title} ${note.tags.map((item) => item.name).join(' ')}`.trim();
      return { tag: present(tag), tags: note.tags };
    },
    async listNoteTags(userId, noteId) {
      const note = notes.get(noteId);
      if (!note || note.userId !== userId) throw notFoundError();
      return note.tags;
    },
    async listNotesByTag(userId, tagId) {
      const tag = tags.get(tagId);
      if (!tag || tag.userId !== userId) throw notFoundError();
      const owned = [...notes.values()].filter(
        (note) =>
          note.userId === userId &&
          note.state !== 'trashed' &&
          note.tags.some((item) => item.id === tagId),
      );
      return { notes: owned.map(present), total: owned.length };
    },
  };
  const searchService = {
    async search(userId, input) {
      const query = input.q.toLowerCase();
      const results = [...notes.values()]
        .filter(
          (note) =>
            note.userId === userId &&
            ['active', 'archived'].includes(note.state) &&
            `${note.title} ${JSON.stringify(note.contentJson)} ${note.tags
              .map((tag) => tag.name)
              .join(' ')}`
              .toLowerCase()
              .includes(query),
        )
        .map((note) => ({
          id: note.id,
          title: note.title,
          state: note.state,
          tags: note.tags,
          updatedAt: note.updatedAt,
          rank: 1,
        }));
      return {
        results: results.slice(
          (input.page - 1) * input.limit,
          input.page * input.limit,
        ),
        total: results.length,
      };
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
    tagsService,
    searchService,
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

  it('accepts the supported rich-text document and rejects unsafe content', async () => {
    const app = createNotesTestApp();
    const formatted = await userRequest(app, 'a', 'post', '/api/v1/notes')
      .set('x-csrf-token', 'test')
      .send({
        contentJson: {
          type: 'doc',
          content: [
            {
              type: 'heading',
              attrs: { level: 2 },
              content: [{ type: 'text', text: 'Title' }],
            },
            {
              type: 'paragraph',
              content: [
                { type: 'text', text: 'safe', marks: [{ type: 'bold' }] },
                {
                  type: 'text',
                  text: ' link',
                  marks: [
                    { type: 'link', attrs: { href: 'https://example.com' } },
                  ],
                },
              ],
            },
            {
              type: 'bulletList',
              content: [
                {
                  type: 'listItem',
                  content: [
                    {
                      type: 'paragraph',
                      content: [{ type: 'text', text: 'item' }],
                    },
                  ],
                },
              ],
            },
            {
              type: 'codeBlock',
              content: [{ type: 'text', text: 'const value = 1;' }],
            },
          ],
        },
      });
    const unsafeLink = await userRequest(app, 'a', 'post', '/api/v1/notes')
      .set('x-csrf-token', 'test')
      .send({
        contentJson: {
          type: 'doc',
          content: [
            {
              type: 'paragraph',
              content: [
                {
                  type: 'text',
                  text: 'x',
                  marks: [
                    { type: 'link', attrs: { href: 'javascript:alert(1)' } },
                  ],
                },
              ],
            },
          ],
        },
      });
    const unsupportedNode = await userRequest(app, 'a', 'post', '/api/v1/notes')
      .set('x-csrf-token', 'test')
      .send({
        contentJson: {
          type: 'doc',
          content: [{ type: 'image', attrs: { src: 'x' } }],
        },
      });

    expect(formatted.status).toBe(201);
    expect(unsafeLink.status).toBe(400);
    expect(unsafeLink.body.error.fields.contentJson).toContain('unsafe');
    expect(unsupportedNode.status).toBe(400);
  });

  it('moves owned notes to Trash and restores them', async () => {
    const app = createNotesTestApp();
    const created = await userRequest(app, 'a', 'post', '/api/v1/notes')
      .set('x-csrf-token', 'test')
      .send({ title: 'Recover me' });
    const noteId = created.body.data.id;

    const trashed = await userRequest(
      app,
      'a',
      'delete',
      `/api/v1/notes/${noteId}`,
    ).set('x-csrf-token', 'test');
    const normalList = await userRequest(app, 'a', 'get', '/api/v1/notes');
    const trashList = await userRequest(app, 'a', 'get', '/api/v1/trash');
    const foreignTrash = await userRequest(app, 'b', 'get', '/api/v1/trash');
    const foreignRestore = await userRequest(
      app,
      'b',
      'post',
      `/api/v1/notes/${noteId}/restore`,
    ).set('x-csrf-token', 'test');
    const restored = await userRequest(
      app,
      'a',
      'post',
      `/api/v1/notes/${noteId}/restore`,
    ).set('x-csrf-token', 'test');

    expect(trashed.body.data).toMatchObject({
      title: 'Recover me',
      state: 'trashed',
      restoreState: 'active',
    });
    expect(normalList.body.data).toHaveLength(0);
    expect(trashList.body.data).toHaveLength(1);
    expect(foreignTrash.body.data).toHaveLength(0);
    expect(foreignRestore.status).toBe(404);
    expect(restored.body.data).toMatchObject({
      title: 'Recover me',
      state: 'active',
      restoreState: null,
      trashedAt: null,
    });
  });

  it('creates unique owned tags and updates note tag associations', async () => {
    const app = createNotesTestApp();
    const created = await userRequest(app, 'a', 'post', '/api/v1/notes')
      .set('x-csrf-token', 'test')
      .send({ title: 'Searchable note' });
    const noteId = created.body.data.id;
    const tag = await userRequest(app, 'a', 'post', '/api/v1/tags')
      .set('x-csrf-token', 'test')
      .send({ name: '  Project   Alpha ' });
    const duplicate = await userRequest(app, 'a', 'post', '/api/v1/tags')
      .set('x-csrf-token', 'test')
      .send({ name: 'project alpha' });
    const foreignTag = await userRequest(app, 'b', 'post', '/api/v1/tags')
      .set('x-csrf-token', 'test')
      .send({ name: 'Private' });
    const assigned = await userRequest(
      app,
      'a',
      'post',
      `/api/v1/notes/${noteId}/tags`,
    )
      .set('x-csrf-token', 'test')
      .send({ tagId: tag.body.data.id });
    const crossUser = await userRequest(
      app,
      'a',
      'post',
      `/api/v1/notes/${noteId}/tags`,
    )
      .set('x-csrf-token', 'test')
      .send({ tagId: foreignTag.body.data.id });
    const removed = await userRequest(
      app,
      'a',
      'delete',
      `/api/v1/notes/${noteId}/tags/${tag.body.data.id}`,
    ).set('x-csrf-token', 'test');

    expect(tag.body.data.name).toBe('Project Alpha');
    expect(duplicate.status).toBe(409);
    expect(assigned.body.data.tags).toHaveLength(1);
    expect(crossUser.status).toBe(404);
    expect(removed.body.data.tags).toHaveLength(0);
  });

  it('searches owned active and archived notes while excluding Trash', async () => {
    const app = createNotesTestApp();
    const active = await userRequest(app, 'a', 'post', '/api/v1/notes')
      .set('x-csrf-token', 'test')
      .send({ title: 'Search title' });
    const archived = await userRequest(app, 'a', 'post', '/api/v1/notes')
      .set('x-csrf-token', 'test')
      .send({ title: 'Archived search' });
    const trashed = await userRequest(app, 'a', 'post', '/api/v1/notes')
      .set('x-csrf-token', 'test')
      .send({ title: 'Hidden search' });
    await userRequest(
      app,
      'a',
      'delete',
      `/api/v1/notes/${trashed.body.data.id}`,
    ).set('x-csrf-token', 'test');
    const foreign = await userRequest(app, 'b', 'post', '/api/v1/notes')
      .set('x-csrf-token', 'test')
      .send({ title: 'Search title' });
    const archivedNote = [
      ...(await userRequest(app, 'a', 'get', '/api/v1/notes')).body.data,
    ].find((note) => note.id === archived.body.data.id);
    expect(archivedNote).toBeDefined();

    const result = await userRequest(
      app,
      'a',
      'get',
      '/api/v1/search?q=search',
    );
    const empty = await userRequest(app, 'a', 'get', '/api/v1/search?q=%20');
    const foreignResult = await userRequest(
      app,
      'b',
      'get',
      '/api/v1/search?q=search',
    );

    expect(active.body.data.title).toBe('Search title');
    expect(foreign.body.data.title).toBe('Search title');
    expect(result.body.data.map((note) => note.title)).toEqual([
      'Search title',
      'Archived search',
    ]);
    expect(result.body.data.map((note) => note.title)).not.toContain(
      'Hidden search',
    );
    expect(empty.status).toBe(400);
    expect(foreignResult.body.data).toHaveLength(1);
  });
});
