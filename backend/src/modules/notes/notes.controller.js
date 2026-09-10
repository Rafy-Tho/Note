import { sendCollection, sendData } from '../../common/utils/response.js';
import { getAuthenticatedUserId } from '../authorization/authorization.js';
import {
  validateCreateNote,
  validateNoteId,
  validateNoteList,
  validateTrashList,
  validateUpdateNote,
} from './notes.validation.js';
import { validateNotebookAssignment } from '../notebooks/notebooks.validation.js';

export function createNotesController({ service }) {
  return {
    async list(request, response, next) {
      try {
        const filters = validateNoteList(request.query);
        const result = await service.list(
          getAuthenticatedUserId(request),
          filters,
        );
        sendCollection(response, result.notes, {
          page: filters.page,
          limit: filters.limit,
          total: result.total,
        });
      } catch (error) {
        next(error);
      }
    },

    async listTrash(request, response, next) {
      try {
        const pagination = validateTrashList(request.query);
        const result = await service.listTrash(
          getAuthenticatedUserId(request),
          pagination,
        );
        sendCollection(response, result.notes, {
          page: pagination.page,
          limit: pagination.limit,
          total: result.total,
        });
      } catch (error) {
        next(error);
      }
    },

    async listFavorites(request, response, next) {
      try {
        const pagination = validateTrashList(request.query);
        const result = await service.listFavorites(
          getAuthenticatedUserId(request),
          pagination,
        );
        sendCollection(response, result.notes, {
          ...pagination,
          total: result.total,
        });
      } catch (error) {
        next(error);
      }
    },

    async create(request, response, next) {
      try {
        const note = await service.create(
          getAuthenticatedUserId(request),
          validateCreateNote(request.body),
        );
        sendData(response, note, 201);
      } catch (error) {
        next(error);
      }
    },

    async get(request, response, next) {
      try {
        const note = await service.get(
          getAuthenticatedUserId(request),
          validateNoteId(request.params.noteId),
        );
        sendData(response, note);
      } catch (error) {
        next(error);
      }
    },

    async update(request, response, next) {
      try {
        const note = await service.update(
          getAuthenticatedUserId(request),
          validateNoteId(request.params.noteId),
          validateUpdateNote(request.body),
        );
        sendData(response, note);
      } catch (error) {
        next(error);
      }
    },

    async trash(request, response, next) {
      try {
        const note = await service.trash(
          getAuthenticatedUserId(request),
          validateNoteId(request.params.noteId),
        );
        sendData(response, note);
      } catch (error) {
        next(error);
      }
    },

    async restore(request, response, next) {
      try {
        const note = await service.restore(
          getAuthenticatedUserId(request),
          validateNoteId(request.params.noteId),
        );
        sendData(response, note);
      } catch (error) {
        next(error);
      }
    },

    async archive(request, response, next) {
      try {
        const note = await service.archive(
          getAuthenticatedUserId(request),
          validateNoteId(request.params.noteId),
        );
        sendData(response, note);
      } catch (error) {
        next(error);
      }
    },

    async unarchive(request, response, next) {
      try {
        const note = await service.unarchive(
          getAuthenticatedUserId(request),
          validateNoteId(request.params.noteId),
        );
        sendData(response, note);
      } catch (error) {
        next(error);
      }
    },

    async favorite(request, response, next) {
      try {
        const note = await service.favorite(
          getAuthenticatedUserId(request),
          validateNoteId(request.params.noteId),
          true,
        );
        sendData(response, note);
      } catch (error) {
        next(error);
      }
    },

    async unfavorite(request, response, next) {
      try {
        const note = await service.favorite(
          getAuthenticatedUserId(request),
          validateNoteId(request.params.noteId),
          false,
        );
        sendData(response, note);
      } catch (error) {
        next(error);
      }
    },

    async permanentDelete(request, response, next) {
      try {
        await service.permanentlyDelete(
          getAuthenticatedUserId(request),
          validateNoteId(request.params.noteId),
        );
        response.status(204).send();
      } catch (error) {
        next(error);
      }
    },

    async assignNotebook(request, response, next) {
      try {
        const note = await service.assignNotebook(
          getAuthenticatedUserId(request),
          validateNoteId(request.params.noteId),
          validateNotebookAssignment(request.body).notebookId,
        );
        sendData(response, note);
      } catch (error) {
        next(error);
      }
    },
  };
}
