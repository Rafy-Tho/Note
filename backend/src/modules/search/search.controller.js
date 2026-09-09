import { sendCollection } from '../../common/http.js';
import { getAuthenticatedUserId } from '../authorization/authorization.js';
import { validateSearch } from './search.validation.js';

export function createSearchController({ service }) {
  return {
    async search(request, response, next) {
      try {
        const input = validateSearch(request.query);
        const result = await service.search(
          getAuthenticatedUserId(request),
          input,
        );
        sendCollection(response, result.results, {
          page: input.page,
          limit: input.limit,
          total: result.total,
        });
      } catch (error) {
        next(error);
      }
    },
  };
}
