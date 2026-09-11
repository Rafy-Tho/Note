import { createProtectedRouter } from '../auth/auth.middleware.js';
import { createNotesController } from './notes.controller.js';
import { createNotesRepository } from './notes.repository.js';
import { createNotesService } from './notes.service.js';

export function createNotesRouter({ authService, config, service } = {}) {
  const router = createProtectedRouter({
    authService,
    cookieName: config.sessionCookieName,
    csrfSecret: config.csrfSecret,
    cookieSecure: config.cookieSecure,
    cookieSameSite: config.cookieSameSite,
    nodeEnv: config.nodeEnv,
  });
  const controller = createNotesController({
    service:
      service ?? createNotesService({ repository: createNotesRepository() }),
  });

  router.get('/', controller.list);
  router.post('/', controller.create);
  router.get('/:noteId', controller.get);
  router.patch('/:noteId', controller.update);
  router.delete('/:noteId', controller.trash);
  router.post('/:noteId/restore', controller.restore);
  router.post('/:noteId/archive', controller.archive);
  router.post('/:noteId/unarchive', controller.unarchive);
  router.post('/:noteId/favorite', controller.favorite);
  router.delete('/:noteId/favorite', controller.unfavorite);
  router.delete('/:noteId/permanent', controller.permanentDelete);
  router.put('/:noteId/notebook', controller.assignNotebook);
  return router;
}

export function createFavoritesRouter({ authService, config, service } = {}) {
  const router = createProtectedRouter({
    authService,
    cookieName: config.sessionCookieName,
    csrfSecret: config.csrfSecret,
    cookieSecure: config.cookieSecure,
    cookieSameSite: config.cookieSameSite,
    nodeEnv: config.nodeEnv,
  });
  const controller = createNotesController({
    service:
      service ?? createNotesService({ repository: createNotesRepository() }),
  });
  router.get('/', controller.listFavorites);
  return router;
}

export function createTrashRouter({ authService, config, service } = {}) {
  const router = createProtectedRouter({
    authService,
    cookieName: config.sessionCookieName,
    csrfSecret: config.csrfSecret,
    cookieSecure: config.cookieSecure,
    cookieSameSite: config.cookieSameSite,
    nodeEnv: config.nodeEnv,
  });
  const controller = createNotesController({
    service:
      service ?? createNotesService({ repository: createNotesRepository() }),
  });

  router.get('/', controller.listTrash);
  return router;
}
