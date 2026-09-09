import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import rateLimit from 'express-rate-limit';
import { Router } from 'express';
import { sendData } from '../../common/http.js';
import { AppError } from '../../common/errors.js';
import { assertObject } from '../../common/validation.js';
import { publicUser } from './auth.constants.js';
import {
  createSessionMiddleware,
  requireAuthentication,
} from './auth.middleware.js';
import { createCsrfMiddleware } from './auth.csrf.js';
import { validateCredentials } from './auth.validation.js';

function setSessionCookie(response, name, token, secure) {
  response.cookie(name, token, {
    httpOnly: true,
    secure,
    sameSite: 'lax',
    path: '/',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
}

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
  const sessionMiddleware = createSessionMiddleware({
    authService,
    cookieName: config.sessionCookieName,
  });

  passport.use(
    new LocalStrategy(
      { usernameField: 'email', passwordField: 'password' },
      async (email, password, done) => {
        try {
          const credentials = validateCredentials({ email, password });
          const user = await authService.verifyCredentials(credentials);
          done(null, user);
        } catch (error) {
          if (error instanceof AppError && error.status === 401)
            done(null, false);
          else done(error);
        }
      },
    ),
  );

  expressRouter.use(sessionMiddleware);
  expressRouter.post(
    '/register',
    authRateLimiter(),
    async (request, response, next) => {
      try {
        assertObject(request.body);
        const credentials = validateCredentials(request.body);
        const user = await authService.register(credentials);
        sendData(response, { user }, 201);
      } catch (error) {
        next(error);
      }
    },
  );

  expressRouter.post('/login', authRateLimiter(), (request, response, next) => {
    passport.authenticate('local', { session: false }, async (error, user) => {
      try {
        if (error) throw error;
        if (!user)
          throw new AppError(
            401,
            'AUTHENTICATION_FAILED',
            'Invalid email or password.',
          );
        const { token } = await authService.createSession(user.id);
        setSessionCookie(
          response,
          config.sessionCookieName,
          token,
          config.nodeEnv === 'production',
        );
        sendData(response, {
          authenticated: true,
          user: publicUser(user),
          csrfToken: authService.csrfToken(token, config.csrfSecret),
        });
      } catch (authError) {
        next(authError);
      }
    })(request, response, next);
  });

  expressRouter.get('/session', (request, response) => {
    sendData(
      response,
      request.auth
        ? {
            authenticated: true,
            user: { id: request.auth.userId, email: request.auth.email },
            csrfToken: authService.csrfToken(
              request.auth.token,
              config.csrfSecret,
            ),
          }
        : { authenticated: false, user: null, csrfToken: null },
    );
  });

  expressRouter.post(
    '/logout',
    requireAuthentication,
    createCsrfMiddleware({ authService, csrfSecret: config.csrfSecret }),
    async (request, response, next) => {
      try {
        await authService.revokeSession(request.auth.token);
        response.clearCookie(config.sessionCookieName, {
          httpOnly: true,
          secure: config.nodeEnv === 'production',
          sameSite: 'lax',
          path: '/',
        });
        response.status(204).send();
      } catch (error) {
        next(error);
      }
    },
  );

  return expressRouter;
}
