import { AppError, notFoundError } from '../../common/errors.js';
import { withTransaction } from '../../db/transaction.js';
import { assertNoteState } from '../authorization/authorization.js';

function searchableText(contentJson) {
  const values = [];
  function visit(value) {
    if (!value || typeof value !== 'object') return;
    if (value.type === 'text' && typeof value.text === 'string')
      values.push(value.text);
    if (Array.isArray(value.content)) value.content.forEach(visit);
  }
  visit(contentJson);
  return values.join(' ');
}

export function createNotesService({
  repository,
  transaction = withTransaction,
} = {}) {
  return {
    async list(userId, filters) {
      return repository.list(userId, filters);
    },

    async listTrash(userId, pagination) {
      return repository.list(userId, {
        ...pagination,
        state: 'trashed',
        favorite: null,
      });
    },

    async get(userId, noteId) {
      const note = await repository.findById(userId, noteId);
      if (!note) throw notFoundError();
      return note;
    },

    async create(userId, input) {
      return transaction((client) =>
        repository.create(client, userId, {
          ...input,
          searchableText:
            `${input.title} ${searchableText(input.contentJson)}`.trim(),
        }),
      );
    },

    async update(userId, noteId, input) {
      const result = await transaction(async (client) => {
        const note = await repository.findById(userId, noteId, client);
        if (!note) return { note: null, updated: null };
        const updated = await repository.update(client, userId, noteId, {
          ...input,
          searchableText:
            input.title === undefined && input.contentJson === undefined
              ? undefined
              : `${input.title ?? note.title} ${searchableText(input.contentJson ?? note.contentJson)}`.trim(),
        });
        return { note, updated };
      });
      if (!result.note) throw notFoundError();
      if (!result.updated)
        throw new AppError(
          409,
          'CONFLICT',
          'The note changed before your update could be saved.',
        );
      return result.updated;
    },

    async trash(userId, noteId) {
      const result = await transaction(async (client) => {
        const note = await repository.findById(userId, noteId, client);
        if (!note) return { note: null, updated: null };
        assertNoteState('trash', note.state);
        return {
          note,
          updated: await repository.moveToTrash(client, userId, noteId),
        };
      });
      if (!result.note) throw notFoundError();
      if (!result.updated)
        throw new AppError(
          409,
          'INVALID_STATE_TRANSITION',
          'The resource is not available for this operation.',
        );
      return result.updated;
    },

    async restore(userId, noteId) {
      const result = await transaction(async (client) => {
        const note = await repository.findById(userId, noteId, client);
        if (!note) return { note: null, updated: null };
        assertNoteState('restore', note.state);
        const notebook = await repository.findOwnedNotebook(
          client,
          userId,
          note.notebookId,
        );
        const state =
          note.restoreState === 'archived' && notebook ? 'archived' : 'active';
        return {
          note,
          updated: await repository.restore(client, userId, noteId, {
            state,
            notebookId: notebook?.id ?? null,
          }),
        };
      });
      if (!result.note) throw notFoundError();
      if (!result.updated)
        throw new AppError(
          409,
          'INVALID_STATE_TRANSITION',
          'The resource is not available for this operation.',
        );
      return result.updated;
    },
  };
}
