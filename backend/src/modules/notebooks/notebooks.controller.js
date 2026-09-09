import { sendCollection, sendData } from '../../common/http.js';
import { getAuthenticatedUserId } from '../authorization/authorization.js';
import {
  validateCreateNotebook,
  validateNotebookId,
  validateNotebookList,
  validateRenameNotebook,
} from './notebooks.validation.js';

export function createNotebooksController({ service }) {
  return {
    async list(request, response, next) {
      try {
        const pagination = validateNotebookList(request.query);
        const result = await service.list(
          getAuthenticatedUserId(request),
          pagination,
        );
        sendCollection(response, result.notebooks, {
          ...pagination,
          total: result.total,
        });
      } catch (error) {
        next(error);
      }
    },
    async create(request, response, next) {
      try {
        const notebook = await service.create(
          getAuthenticatedUserId(request),
          validateCreateNotebook(request.body),
        );
        sendData(response, notebook, 201);
      } catch (error) {
        next(error);
      }
    },
    async rename(request, response, next) {
      try {
        const notebook = await service.rename(
          getAuthenticatedUserId(request),
          validateNotebookId(request.params.notebookId),
          validateRenameNotebook(request.body),
        );
        sendData(response, notebook);
      } catch (error) {
        next(error);
      }
    },
    async remove(request, response, next) {
      try {
        await service.delete(
          getAuthenticatedUserId(request),
          validateNotebookId(request.params.notebookId),
        );
        response.status(204).send();
      } catch (error) {
        next(error);
      }
    },
  };
}
