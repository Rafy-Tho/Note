import { createProtectedRouter } from '../auth/auth.middleware.js';
import { createTagsController } from './tags.controller.js';
import { createTagsRepository } from './tags.repository.js';
import { createTagsService } from './tags.service.js';

function createRouter({ authService, config }) {
  return createProtectedRouter({
    authService,
    cookieName: config.sessionCookieName,
    csrfSecret: config.csrfSecret,
  });
}

export function createTagsRouter({ authService, config, service } = {}) {
  const router = createRouter({ authService, config });
  const controller = createTagsController({
    service:
      service ?? createTagsService({ repository: createTagsRepository() }),
  });

  router.get('/', controller.list);
  router.post('/', controller.create);
  router.patch('/:tagId', controller.rename);
  router.delete('/:tagId', controller.removeTag);
  router.get('/:tagId/notes', controller.listNotesByTag);
  return router;
}

export function createNoteTagsRouter({ authService, config, service } = {}) {
  const router = createRouter({ authService, config });
  const controller = createTagsController({
    service:
      service ?? createTagsService({ repository: createTagsRepository() }),
  });

  router.get('/:noteId/tags', controller.listNoteTags);
  router.post('/:noteId/tags', controller.assign);
  router.delete('/:noteId/tags/:tagId', controller.remove);
  return router;
}
