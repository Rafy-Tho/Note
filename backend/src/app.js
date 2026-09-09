import express from 'express';
import { createHealthRouter } from './modules/health/health.routes.js';

export function createApp({ databaseCheck } = {}) {
  const app = express();

  app.disable('x-powered-by');
  app.use(express.json({ limit: '1mb' }));

  app.use('/api/v1/health', createHealthRouter({ databaseCheck }));

  return app;
}
