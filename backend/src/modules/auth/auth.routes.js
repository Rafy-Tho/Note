import rateLimit from 'express-rate-limit';
import { Router } from 'express';
import {
  createSessionMiddleware,
  requireAuthentication,
} from './auth.middleware.js';
import { createCsrfMiddleware } from './auth.csrf.js';
import { createAuthController } from './auth.controller.js';

function authRateLimiter() {
  return rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    statusCode: 429,
    message: {
      error: {
        code: 'RATE_LIMITED',
        message: 'Too many authentication attempts.',
      },
    },
  });
}

export function createAuthRouter({ authService, config }) {
  const expressRouter = Router();
  const controller = createAuthController({ authService, config });
  const sessionMiddleware = createSessionMiddleware({
    authService,
    cookieName: config.sessionCookieName,
  });

  expressRouter.use(sessionMiddleware);
  expressRouter.post('/register', authRateLimiter(), controller.register);
  expressRouter.post('/login', authRateLimiter(), controller.login);
  expressRouter.post(
    '/email/verify',
    authRateLimiter(),
    controller.verifyEmail,
  );
  expressRouter.post(
    '/email/verification/resend',
    authRateLimiter(),
    controller.resendVerification,
  );
  expressRouter.post(
    '/password/reset/request',
    authRateLimiter(),
    controller.requestPasswordReset,
  );
  expressRouter.post(
    '/password/reset/confirm',
    authRateLimiter(),
    controller.confirmPasswordReset,
  );
  expressRouter.get('/google/start', controller.startGoogleSignIn);
  expressRouter.get(
    '/google/callback',
    authRateLimiter(),
    controller.completeGoogleSignIn,
  );
  expressRouter.get('/session', controller.getSession);

  expressRouter.post(
    '/logout',
    requireAuthentication,
    createCsrfMiddleware({ authService, csrfSecret: config.csrfSecret }),
    controller.logout,
  );

  return expressRouter;
}
