import express from 'express';
import { createLogger } from './common/logger.js';
import { validationError } from './common/errors.js';
import { errorHandler, notFoundHandler } from './middleware/errors.js';
import { requestContext } from './middleware/request-context.js';
import { requestLogging } from './middleware/logging.js';
import { createHealthRouter } from './modules/health/health.routes.js';

export function createApp({
  databaseCheck,
  logger = createLogger(),
  configureRoutes = () => {},
} = {}) {
  const app = express();

  app.disable('x-powered-by');
  app.use(requestContext);
  app.use(requestLogging(logger));
  app.use(express.json({ limit: '1mb' }));

  app.use('/api/v1/health', createHealthRouter({ databaseCheck }));
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
