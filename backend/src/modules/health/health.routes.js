import { Router } from 'express';
import { checkDatabase } from '../../db/pool.js';
import { AppError } from '../../common/errors/errors.js';
import { sendData, sendError } from '../../common/utils/response.js';

export function createHealthRouter({ databaseCheck = checkDatabase } = {}) {
  const router = Router();

  router.get('/', async (_request, response) => {
    try {
      await databaseCheck();
      sendData(response, { status: 'ok', database: 'ok' });
    } catch {
      sendError(
        response,
        new AppError(
          503,
          'SERVICE_UNAVAILABLE',
          'The service is temporarily unavailable.',
        ),
      );
    }
  });

  return router;
}
