import { AppError, notFoundError } from '../../common/errors.js';
import { withTransaction } from '../../db/transaction.js';

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
      const note = await repository.findById(userId, noteId);
      if (!note) throw notFoundError();
      const updated = await transaction((client) =>
        repository.update(client, userId, noteId, {
          ...input,
          searchableText:
            input.title === undefined && input.contentJson === undefined
              ? undefined
              : `${input.title ?? note.title} ${searchableText(input.contentJson ?? note.contentJson)}`.trim(),
        }),
      );
      if (!updated)
        throw new AppError(
          409,
          'CONFLICT',
          'The note changed before your update could be saved.',
        );
      return updated;
    },
  };
}
