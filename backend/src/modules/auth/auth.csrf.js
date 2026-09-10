import { AppError } from '../../common/errors/errors.js';

export function createCsrfMiddleware({ authService, csrfSecret }) {
  return (request, _response, next) => {
    if (['GET', 'HEAD', 'OPTIONS'].includes(request.method) || !request.auth) {
      next();
      return;
    }
    const token = request.get('x-csrf-token');
    if (!authService.csrfMatches(request.auth.token, token, csrfSecret)) {
      next(
        new AppError(403, 'CSRF_INVALID', 'The request could not be verified.'),
      );
      return;
    }
    next();
  };
}
