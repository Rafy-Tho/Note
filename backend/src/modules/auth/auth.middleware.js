import {
  AppError,
  authenticationRequiredError,
} from '../../common/errors/errors.js';
import { Router } from 'express';
import { createCsrfMiddleware } from './auth.csrf.js';

export function readCookie(request, name) {
  const header = request.get('cookie') ?? '';
  for (const part of header.split(';')) {
    const separator = part.indexOf('=');
    if (separator < 0) continue;
    const key = part.slice(0, separator).trim();
    if (key === name)
      return decodeURIComponent(part.slice(separator + 1).trim());
  }
  return null;
}

export function createSessionMiddleware({ authService, cookieName }) {
  return async (request, response, next) => {
    try {
      const token = readCookie(request, cookieName);
      const session = await authService.authenticateToken(token);
      if (session) {
        request.auth = { ...session, token };
      } else if (token) {
        response.clearCookie(cookieName, {
          httpOnly: true,
          sameSite: 'lax',
          path: '/',
        });
      }
      next();
    } catch (error) {
      next(error);
    }
  };
}

export function requireAuthentication(request, _response, next) {
  if (!request.auth) {
    next(authenticationRequiredError());
    return;
  }
  next();
}

export function requireVerifiedEmail(request, _response, next) {
  if (!request.auth?.emailVerifiedAt) {
    next(
      new AppError(
        403,
        'EMAIL_VERIFICATION_REQUIRED',
        'Email verification is required to access private notes.',
      ),
    );
    return;
  }
  next();
}

export function createProtectedRouter({ authService, cookieName, csrfSecret }) {
  const router = Router();
  router.use(createSessionMiddleware({ authService, cookieName }));
  router.use(requireAuthentication);
  router.use(requireVerifiedEmail);
  router.use(createCsrfMiddleware({ authService, csrfSecret }));
  return router;
}

export function getSessionToken(request, cookieName) {
  return readCookie(request, cookieName);
}
