import { createProtectedRouter } from '../auth/auth.middleware.js';
import { createNotebooksController } from './notebooks.controller.js';
import { createNotebooksRepository } from './notebooks.repository.js';
import { createNotebooksService } from './notebooks.service.js';

export function createNotebooksRouter({ authService, config, service } = {}) {
  const router = createProtectedRouter({
    authService,
    cookieName: config.sessionCookieName,
    csrfSecret: config.csrfSecret,
  });
  const controller = createNotebooksController({
    service:
      service ??
      createNotebooksService({ repository: createNotebooksRepository() }),
  });
  router.get('/', controller.list);
  router.post('/', controller.create);
  router.patch('/:notebookId', controller.rename);
  router.delete('/:notebookId', controller.remove);
  return router;
}
