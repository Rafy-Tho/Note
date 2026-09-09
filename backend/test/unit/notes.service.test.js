import { describe, expect, it, vi } from 'vitest';
import { createNotesService } from '../../src/modules/notes/notes.service.js';

function createTransaction() {
  return (work) => work({ query: vi.fn() });
}

describe('notes recovery service', () => {
  it('restores an archived note with its owned notebook', async () => {
    const note = {
      id: 'note-1',
      userId: 'user-1',
      notebookId: 'notebook-1',
      state: 'trashed',
      restoreState: 'archived',
    };
    const restore = vi.fn(async (_client, _userId, _noteId, input) => ({
      ...note,
      ...input,
      restoreState: null,
      trashedAt: null,
    }));
    const repository = {
      findById: vi.fn(async () => note),
      findOwnedNotebook: vi.fn(async () => ({ id: 'notebook-1' })),
      restore,
    };
    const service = createNotesService({
      repository,
      transaction: createTransaction(),
    });

    const result = await service.restore('user-1', 'note-1');

    expect(restore).toHaveBeenCalledWith(
      expect.anything(),
      'user-1',
      'note-1',
      { state: 'archived', notebookId: 'notebook-1' },
    );
    expect(result.state).toBe('archived');
  });

  it('falls back to active without a deleted notebook', async () => {
    const note = {
      id: 'note-1',
      userId: 'user-1',
      notebookId: 'deleted-notebook',
      state: 'trashed',
      restoreState: 'archived',
    };
    const restore = vi.fn(async (_client, _userId, _noteId, input) => input);
    const repository = {
      findById: vi.fn(async () => note),
      findOwnedNotebook: vi.fn(async () => null),
      restore,
    };
    const service = createNotesService({
      repository,
      transaction: createTransaction(),
    });

    await service.restore('user-1', 'note-1');

    expect(restore).toHaveBeenCalledWith(
      expect.anything(),
      'user-1',
      'note-1',
      { state: 'active', notebookId: null },
    );
  });
});
