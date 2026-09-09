import { createProtectedRouter } from '../auth/auth.middleware.js';
import { createNotesController } from './notes.controller.js';
import { createNotesRepository } from './notes.repository.js';
import { createNotesService } from './notes.service.js';

export function createNotesRouter({ authService, config, service } = {}) {
  const router = createProtectedRouter({
    authService,
    cookieName: config.sessionCookieName,
    csrfSecret: config.csrfSecret,
  });
  const controller = createNotesController({
    service:
      service ?? createNotesService({ repository: createNotesRepository() }),
  });

  router.get('/', controller.list);
  router.post('/', controller.create);
  router.get('/:noteId', controller.get);
  router.patch('/:noteId', controller.update);
  return router;
}
