import express from 'express';
import { requestContext } from '../common/middleware/request-context.js';
import { requestLogging } from '../common/middleware/logging.js';

export function configureMiddleware(app, { logger }) {
  app.use(requestContext);
  app.use(requestLogging(logger));
  app.use(express.json({ limit: '1mb' }));
}
