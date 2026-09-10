import { sendCollection, sendData } from '../../common/utils/response.js';
import { getAuthenticatedUserId } from '../authorization/authorization.js';
import {
  validateAssignTag,
  validateCreateTag,
  validateNoteId,
  validateTagId,
  validateTagList,
  validateRenameTag,
} from './tags.validation.js';

export function createTagsController({ service }) {
  return {
    async list(request, response, next) {
      try {
        const pagination = validateTagList(request.query);
        const result = await service.list(
          getAuthenticatedUserId(request),
          pagination,
        );
        sendCollection(response, result.tags, {
          page: pagination.page,
          limit: pagination.limit,
          total: result.total,
        });
      } catch (error) {
        next(error);
      }
    },

    async create(request, response, next) {
      try {
        const tag = await service.create(
          getAuthenticatedUserId(request),
          validateCreateTag(request.body),
        );
        sendData(response, tag, 201);
      } catch (error) {
        next(error);
      }
    },

    async rename(request, response, next) {
      try {
        const tag = await service.rename(
          getAuthenticatedUserId(request),
          validateTagId(request.params.tagId),
          validateRenameTag(request.body),
        );
        sendData(response, tag);
      } catch (error) {
        next(error);
      }
    },

    async removeTag(request, response, next) {
      try {
        await service.delete(
          getAuthenticatedUserId(request),
          validateTagId(request.params.tagId),
        );
        response.status(204).send();
      } catch (error) {
        next(error);
      }
    },

    async assign(request, response, next) {
      try {
        const result = await service.assign(
          getAuthenticatedUserId(request),
          validateNoteId(request.params.noteId),
          validateAssignTag(request.body).tagId,
        );
        sendData(response, result);
      } catch (error) {
        next(error);
      }
    },

    async remove(request, response, next) {
      try {
        const result = await service.remove(
          getAuthenticatedUserId(request),
          validateNoteId(request.params.noteId),
          validateTagId(request.params.tagId),
        );
        sendData(response, result);
      } catch (error) {
        next(error);
      }
    },

    async listNoteTags(request, response, next) {
      try {
        const tags = await service.listNoteTags(
          getAuthenticatedUserId(request),
          validateNoteId(request.params.noteId),
        );
        sendData(response, tags);
      } catch (error) {
        next(error);
      }
    },

    async listNotesByTag(request, response, next) {
      try {
        const pagination = validateTagList(request.query);
        const result = await service.listNotesByTag(
          getAuthenticatedUserId(request),
          validateTagId(request.params.tagId),
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
  };
}
