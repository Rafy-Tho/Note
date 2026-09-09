import express from 'express';
import { checkDatabase } from './db.js';

export function createApp({ databaseCheck = checkDatabase } = {}) {
  const app = express();

  app.disable('x-powered-by');
  app.use(express.json({ limit: '1mb' }));

  app.get('/api/v1/health', async (_request, response) => {
    try {
      await databaseCheck();
      response.json({ data: { status: 'ok', database: 'ok' } });
    } catch {
      response.status(503).json({
        error: {
          code: 'SERVICE_UNAVAILABLE',
          message: 'The service is temporarily unavailable.',
        },
      });
    }
  });

  return app;
}
