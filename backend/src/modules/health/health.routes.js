import { Router } from 'express';
import { checkDatabase } from '../../db/pool.js';

export function createHealthRouter({ databaseCheck = checkDatabase } = {}) {
  const router = Router();

  router.get('/', async (_request, response) => {
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

  return router;
}
