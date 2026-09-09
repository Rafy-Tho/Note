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
import {
  createNotesRouter,
  createTrashRouter,
} from './modules/notes/notes.routes.js';

export function createApp({
  databaseCheck,
  logger = createLogger(),
  configureRoutes = () => {},
  config = getConfig(),
  authService = createAuthService({ repository: createAuthRepository() }),
  notesService,
} = {}) {
  const app = express();

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
    '/api/v1/trash',
    createTrashRouter({ authService, config, service: notesService }),
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
