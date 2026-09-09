import { AppError, notFoundError } from '../../common/errors.js';
import { withTransaction } from '../../db/transaction.js';

export function createNotebooksService({
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
            'DUPLICATE_NOTEBOOK',
            'A notebook with that name already exists.',
          );
        throw error;
      }
    },

    async rename(userId, notebookId, input) {
      try {
        const result = await transaction(async (client) => {
          const notebook = await repository.findById(
            client,
            userId,
            notebookId,
          );
          if (!notebook) return null;
          return repository.rename(client, userId, notebookId, input);
        });
        if (!result) throw notFoundError();
        return result;
      } catch (error) {
        if (error.code === '23505')
          throw new AppError(
            409,
            'DUPLICATE_NOTEBOOK',
            'A notebook with that name already exists.',
          );
        throw error;
      }
    },

    async delete(userId, notebookId) {
      const deleted = await transaction((client) =>
        repository.delete(client, userId, notebookId),
      );
      if (!deleted) throw notFoundError();
    },
  };
}
