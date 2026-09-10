import express from 'express';
import { createLogger } from '../common/utils/logger.js';
import { validationError } from '../common/errors/errors.js';
import {
  errorHandler,
  notFoundHandler,
} from '../common/errors/errorHandler.js';
import { configureMiddleware } from './middleware.js';
import { configureRoutes } from './routes.js';
import { getConfig } from '../config/env.js';
import { createAuthRepository } from '../modules/auth/auth.repository.js';
import { createAuthService } from '../modules/auth/auth.service.js';
import { createBrevoMailService } from '../modules/auth/mail.service.js';
import { createGoogleProvider } from '../modules/auth/providers/google.provider.js';
import { createFacebookProvider } from '../modules/auth/providers/facebook.provider.js';
import { createTagsRepository } from '../modules/tags/tags.repository.js';
import { createTagsService } from '../modules/tags/tags.service.js';
import { createNotebooksRepository } from '../modules/notebooks/notebooks.repository.js';
import { createNotebooksService } from '../modules/notebooks/notebooks.service.js';

export function createApp({
  databaseCheck,
  logger = createLogger(),
  configureRoutes: extendRoutes = () => {},
  config = getConfig(),
  authService = createAuthService({
    repository: createAuthRepository(),
    mailService: createBrevoMailService({
      apiKey: config.brevoApiKey,
      fromEmail: config.brevoFromEmail,
      fromName: config.brevoFromName,
      appUrl: config.appUrl,
    }),
    authCodeSecret: config.authCodeSecret,
    googleProvider: createGoogleProvider(config),
    facebookProvider: createFacebookProvider(config),
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
  configureMiddleware(app, { logger });
  configureRoutes(app, {
    databaseCheck,
    authService,
    config,
    notesService,
    tagsService: resolvedTagsService,
    searchService,
    notebooksService: resolvedNotebooksService,
  });
  extendRoutes(app);

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
