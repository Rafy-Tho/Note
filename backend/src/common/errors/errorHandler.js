import { notFoundError, normalizeError } from './errors.js';
import { sendError } from '../utils/response.js';

export function notFoundHandler(_request, _response, next) {
  next(notFoundError());
}

export function errorHandler(error, request, response, next) {
  if (response.headersSent) {
    next(error);
    return;
  }

  const normalized = normalizeError(error);
  if (normalized.status >= 500 && request.logger) {
    request.logger.error('Unhandled request error', error, {
      requestId: request.requestId,
      method: request.method,
      path: request.path,
    });
  }
  sendError(response, normalized);
}
