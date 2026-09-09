import { sendCollection, sendData } from '../../common/http.js';
import { getAuthenticatedUserId } from '../authorization/authorization.js';
import {
  validateCreateNote,
  validateNoteId,
  validateNoteList,
  validateUpdateNote,
} from './notes.validation.js';

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
  };
}
