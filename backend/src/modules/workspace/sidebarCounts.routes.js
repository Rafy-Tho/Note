import { createProtectedRouter } from '../auth/auth.middleware.js';
import { createSidebarCountsController } from './sidebarCounts.controller.js';
import { createSidebarCountsRepository } from './sidebarCounts.repository.js';
import { createSidebarCountsService } from './sidebarCounts.service.js';

export function createSidebarCountsRouter({
  authService,
  config,
  service,
} = {}) {
  const router = createProtectedRouter({
    authService,
    cookieName: config.sessionCookieName,
    csrfSecret: config.csrfSecret,
    cookieSecure: config.cookieSecure,
    cookieSameSite: config.cookieSameSite,
    nodeEnv: config.nodeEnv,
  });
  const controller = createSidebarCountsController({
    service:
      service ??
      createSidebarCountsService({
        repository: createSidebarCountsRepository(),
      }),
  });
  router.get('/', controller.get);
  return router;
}
