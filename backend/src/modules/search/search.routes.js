import { createProtectedRouter } from '../auth/auth.middleware.js';
import { createSearchController } from './search.controller.js';
import { createSearchRepository } from './search.repository.js';
import { createSearchService } from './search.service.js';

export function createSearchRouter({ authService, config, service } = {}) {
  const router = createProtectedRouter({
    authService,
    cookieName: config.sessionCookieName,
    csrfSecret: config.csrfSecret,
  });
  const controller = createSearchController({
    service:
      service ?? createSearchService({ repository: createSearchRepository() }),
  });

  router.get('/', controller.search);
  return router;
}
