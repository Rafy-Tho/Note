import { sendData } from '../../common/utils/response.js';
import { getAuthenticatedUserId } from '../authorization/authorization.js';

export function createSidebarCountsController({ service }) {
  return {
    async get(request, response, next) {
      try {
        const counts = await service.get(getAuthenticatedUserId(request));
        sendData(response, counts);
      } catch (error) {
        next(error);
      }
    },
  };
}
