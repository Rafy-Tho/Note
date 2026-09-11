import { Router } from 'express';
import {
  createSessionMiddleware,
  requireAuthentication,
  requireVerifiedEmail,
} from './auth.middleware.js';
import { createCsrfMiddleware } from './auth.csrf.js';
import { createAuthController } from './auth.controller.js';
import { createAuthRateLimiter } from '../../common/middleware/rate-limit.js';

export function createAuthRouter({ authService, config, rateLimitStores }) {
  const expressRouter = Router();
  const controller = createAuthController({ authService, config });
  const authLimiter = createAuthRateLimiter(config, rateLimitStores);
  const sessionMiddleware = createSessionMiddleware({
    authService,
    cookieName: config.sessionCookieName,
    cookieSecure: config.cookieSecure,
    cookieSameSite: config.cookieSameSite,
    nodeEnv: config.nodeEnv,
  });

  expressRouter.use(sessionMiddleware);
  expressRouter.post('/register', authLimiter, controller.register);
  expressRouter.post('/login', authLimiter, controller.login);
  expressRouter.post('/email/verify', authLimiter, controller.verifyEmail);
  expressRouter.post(
    '/email/verification/resend',
    authLimiter,
    controller.resendVerification,
  );
  expressRouter.post(
    '/password/reset/request',
    authLimiter,
    controller.requestPasswordReset,
  );
  expressRouter.post(
    '/password/reset/confirm',
    authLimiter,
    controller.confirmPasswordReset,
  );
  expressRouter.get('/google/start', authLimiter, controller.startGoogleSignIn);
  expressRouter.get(
    '/google/callback',
    authLimiter,
    controller.completeGoogleSignIn,
  );
  expressRouter.get(
    '/facebook/start',
    authLimiter,
    controller.startFacebookSignIn,
  );
  expressRouter.get(
    '/facebook/callback',
    authLimiter,
    controller.completeFacebookSignIn,
  );
  expressRouter.get(
    '/identities',
    requireAuthentication,
    requireVerifiedEmail,
    controller.listLinkedProviders,
  );
  expressRouter.post(
    '/identities/:provider/link',
    requireAuthentication,
    requireVerifiedEmail,
    authLimiter,
    createCsrfMiddleware({ authService, csrfSecret: config.csrfSecret }),
    controller.startProviderLink,
  );
  expressRouter.get(
    '/:provider/link/callback',
    requireAuthentication,
    requireVerifiedEmail,
    authLimiter,
    controller.completeProviderLink,
  );
  expressRouter.delete(
    '/identities/:provider',
    requireAuthentication,
    requireVerifiedEmail,
    createCsrfMiddleware({ authService, csrfSecret: config.csrfSecret }),
    controller.unlinkProvider,
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
