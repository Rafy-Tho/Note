import { AppError, notFoundError } from '../../common/errors/errors.js';
import { withTransaction } from '../../db/transaction.js';
import { assertNoteState } from '../authorization/authorization.js';
import { buildSearchProjection } from '../notes/notes.search.js';

export function createTagsService({
  repository,
  transaction = withTransaction,
} = {}) {
  return {
    async list(userId, pagination) {
      return repository.list(userId, pagination);
    },

    async create(userId, input) {
      try {
        return await transaction((client) =>
          repository.create(client, userId, input),
        );
      } catch (error) {
        if (error.code === '23505')
          throw new AppError(
            409,
            'DUPLICATE_TAG',
            'A tag with that name already exists.',
          );
        throw error;
      }
    },

    async assign(userId, noteId, tagId) {
      return transaction(async (client) => {
        const note = await repository.findNote(client, userId, noteId);
        if (!note) throw notFoundError();
        assertNoteState('edit', note.state);
        const tag = await repository.findTag(client, userId, tagId);
        if (!tag) throw notFoundError();
        await repository.assign(client, noteId, tagId);
        const tags = await repository.listNoteTags(client, userId, noteId);
        await repository.updateSearchProjection(
          client,
          userId,
          noteId,
          buildSearchProjection(
            note.title,
            note.content_json,
            tags.map((item) => item.name),
          ),
        );
        return { tag, tags };
      });
    },

    async remove(userId, noteId, tagId) {
      return transaction(async (client) => {
        const note = await repository.findNote(client, userId, noteId);
        if (!note) throw notFoundError();
        assertNoteState('edit', note.state);
        const tag = await repository.findTag(client, userId, tagId);
        if (!tag) throw notFoundError();
        await repository.remove(client, userId, noteId, tagId);
        const tags = await repository.listNoteTags(client, userId, noteId);
        await repository.updateSearchProjection(
          client,
          userId,
          noteId,
          buildSearchProjection(
            note.title,
            note.content_json,
            tags.map((item) => item.name),
          ),
        );
        return { tag, tags };
      });
    },

    async listNoteTags(userId, noteId) {
      return transaction(async (client) => {
        const note = await repository.findNote(client, userId, noteId);
        if (!note) throw notFoundError();
        return repository.listNoteTags(client, userId, noteId);
      });
    },

    async listNotesByTag(userId, tagId, pagination) {
      const result = await transaction(async (client) => {
        const tag = await repository.findTag(client, userId, tagId);
        if (!tag) throw notFoundError();
        return repository.listNotesByTag(client, userId, tagId, pagination);
      });
      return result;
    },
  };
}
