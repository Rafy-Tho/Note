import express from 'express';
import passport from 'passport';
import { createLogger } from './common/logger.js';
import { validationError } from './common/errors.js';
import { errorHandler, notFoundHandler } from './middleware/errors.js';
import { requestContext } from './middleware/request-context.js';
import { requestLogging } from './middleware/logging.js';
import { createHealthRouter } from './modules/health/health.routes.js';
import { getConfig } from './config/env.js';
import { createAuthRepository } from './modules/auth/auth.repository.js';
import { createAuthService } from './modules/auth/auth.service.js';
import { createAuthRouter } from './modules/auth/auth.routes.js';
import { createResendMailService } from './modules/auth/mail.service.js';
import { createGoogleProvider } from './modules/auth/google.provider.js';
import {
  createNotesRouter,
  createTrashRouter,
  createFavoritesRouter,
} from './modules/notes/notes.routes.js';
import {
  createNoteTagsRouter,
  createTagsRouter,
} from './modules/tags/tags.routes.js';
import { createTagsRepository } from './modules/tags/tags.repository.js';
import { createTagsService } from './modules/tags/tags.service.js';
import { createSearchRouter } from './modules/search/search.routes.js';
import { createNotebooksRouter } from './modules/notebooks/notebooks.routes.js';
import { createNotebooksRepository } from './modules/notebooks/notebooks.repository.js';
import { createNotebooksService } from './modules/notebooks/notebooks.service.js';

export function createApp({
  databaseCheck,
  logger = createLogger(),
  configureRoutes = () => {},
  config = getConfig(),
  authService = createAuthService({
    repository: createAuthRepository(),
    mailService: createResendMailService(config),
    googleProvider: createGoogleProvider(config),
  }),
  notesService,
  tagsService,
  searchService,
  notebooksService,
} = {}) {
  const app = express();
  const resolvedTagsService =
    tagsService ?? createTagsService({ repository: createTagsRepository() });
  const resolvedNotebooksService =
    notebooksService ??
    createNotebooksService({ repository: createNotebooksRepository() });

  app.disable('x-powered-by');
  app.use(requestContext);
  app.use(requestLogging(logger));
  app.use(express.json({ limit: '1mb' }));
  app.use(passport.initialize());

  app.use('/api/v1/health', createHealthRouter({ databaseCheck }));
  app.use('/api/v1/auth', createAuthRouter({ authService, config }));
  app.use(
    '/api/v1/notes',
    createNotesRouter({ authService, config, service: notesService }),
  );
  app.use(
    '/api/v1/search',
    createSearchRouter({ authService, config, service: searchService }),
  );
  app.use(
    '/api/v1/trash',
    createTrashRouter({ authService, config, service: notesService }),
  );
  app.use(
    '/api/v1/favorites',
    createFavoritesRouter({ authService, config, service: notesService }),
  );
  app.use(
    '/api/v1/notebooks',
    createNotebooksRouter({
      authService,
      config,
      service: resolvedNotebooksService,
    }),
  );
  app.use(
    '/api/v1/tags',
    createTagsRouter({ authService, config, service: resolvedTagsService }),
  );
  app.use(
    '/api/v1/notes',
    createNoteTagsRouter({
      authService,
      config,
      service: resolvedTagsService,
    }),
  );
  configureRoutes(app);

  app.use(notFoundHandler);
  app.use((error, _request, _response, next) => {
    if (error instanceof SyntaxError && 'body' in error) {
      next(validationError({ body: 'Malformed JSON.' }));
      return;
    }
    next(error);
  });
  app.use(errorHandler);

  return app;
}
