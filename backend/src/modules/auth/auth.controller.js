import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import { sendData } from '../../common/http.js';
import { AppError } from '../../common/errors.js';
import { assertObject } from '../../common/validation.js';
import { publicUser } from './auth.constants.js';
import { AUTH_BROWSER_BINDING_COOKIE } from './auth.constants.js';
import { createOpaqueToken } from './auth.tokens.js';
import { readCookie } from './auth.middleware.js';
import {
  validateCredentials,
  validateEmailBody,
  validatePasswordResetBody,
  validateVerificationTokenBody,
} from './auth.validation.js';

function setSessionCookie(response, name, token, secure) {
  response.cookie(name, token, {
    httpOnly: true,
    secure,
    sameSite: 'lax',
    path: '/',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
}

function getOrSetBrowserBinding(request, response, secure) {
  const existing = readCookie(request, AUTH_BROWSER_BINDING_COOKIE);
  if (existing) return existing;

  const binding = createOpaqueToken();
  response.cookie(AUTH_BROWSER_BINDING_COOKIE, binding, {
    httpOnly: true,
    secure,
    sameSite: 'lax',
    path: '/',
    maxAge: 10 * 60 * 1000,
  });
  return binding;
}

function clearBrowserBinding(response, secure) {
  response.clearCookie(AUTH_BROWSER_BINDING_COOKIE, {
    httpOnly: true,
    secure,
    sameSite: 'lax',
    path: '/',
  });
}

export function createAuthController({ authService, config }) {
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

  return {
    async register(request, response, next) {
      try {
        assertObject(request.body);
        const credentials = validateCredentials(request.body);
        const user = await authService.register(credentials);
        sendData(response, { user }, 201);
      } catch (error) {
        next(error);
      }
    },

    async verifyEmail(request, response, next) {
      try {
        assertObject(request.body);
        const token = validateVerificationTokenBody(request.body);
        const user = await authService.verifyEmail(token);
        sendData(response, { user });
      } catch (error) {
        next(error);
      }
    },

    async resendVerification(request, response, next) {
      try {
        assertObject(request.body);
        const email = validateEmailBody(request.body);
        const result = await authService.requestEmailVerification(email);
        sendData(response, result);
      } catch (error) {
        next(error);
      }
    },

    async requestPasswordReset(request, response, next) {
      try {
        assertObject(request.body);
        const email = validateEmailBody(request.body);
        const result = await authService.requestPasswordReset(email);
        sendData(response, result);
      } catch (error) {
        next(error);
      }
    },

    async confirmPasswordReset(request, response, next) {
      try {
        assertObject(request.body);
        const credentials = validatePasswordResetBody(request.body);
        const user = await authService.resetPassword(
          credentials.token,
          credentials.password,
        );
        sendData(response, { user });
      } catch (error) {
        next(error);
      }
    },

    async startGoogleSignIn(request, response, next) {
      try {
        const secure = config.nodeEnv === 'production';
        const browserBinding = getOrSetBrowserBinding(
          request,
          response,
          secure,
        );
        const authorizationUrl = await authService.startGoogleSignIn({
          browserBinding,
        });
        response.redirect(authorizationUrl);
      } catch (error) {
        next(error);
      }
    },

    async completeGoogleSignIn(request, response, next) {
      try {
        const browserBinding = readCookie(request, AUTH_BROWSER_BINDING_COOKIE);
        const result = await authService.completeGoogleSignIn({
          code: request.query.code,
          state: request.query.state,
          browserBinding,
        });
        const secure = config.nodeEnv === 'production';
        setSessionCookie(
          response,
          config.sessionCookieName,
          result.token,
          secure,
        );
        clearBrowserBinding(response, secure);
        sendData(response, {
          authenticated: true,
          user: result.user,
          csrfToken: authService.csrfToken(result.token, config.csrfSecret),
        });
      } catch (error) {
        next(error);
      }
    },

    async startFacebookSignIn(request, response, next) {
      try {
        const secure = config.nodeEnv === 'production';
        const browserBinding = getOrSetBrowserBinding(
          request,
          response,
          secure,
        );
        const authorizationUrl = await authService.startFacebookSignIn({
          browserBinding,
        });
        response.redirect(authorizationUrl);
      } catch (error) {
        next(error);
      }
    },

    async completeFacebookSignIn(request, response, next) {
      try {
        const browserBinding = readCookie(request, AUTH_BROWSER_BINDING_COOKIE);
        const result = await authService.completeFacebookSignIn({
          code: request.query.code,
          state: request.query.state,
          browserBinding,
        });
        const secure = config.nodeEnv === 'production';
        setSessionCookie(
          response,
          config.sessionCookieName,
          result.token,
          secure,
        );
        clearBrowserBinding(response, secure);
        sendData(response, {
          authenticated: true,
          user: result.user,
          csrfToken: authService.csrfToken(result.token, config.csrfSecret),
        });
      } catch (error) {
        next(error);
      }
    },

    async listLinkedProviders(request, response, next) {
      try {
        const identities = await authService.listLinkedProviders(
          request.auth.userId,
        );
        sendData(response, { identities });
      } catch (error) {
        next(error);
      }
    },

    async startProviderLink(request, response, next) {
      try {
        const secure = config.nodeEnv === 'production';
        const browserBinding = getOrSetBrowserBinding(
          request,
          response,
          secure,
        );
        const authorizationUrl = await authService.startProviderLink({
          provider: request.params.provider,
          browserBinding,
          sessionId: request.auth.id,
          userId: request.auth.userId,
        });
        response.redirect(authorizationUrl);
      } catch (error) {
        next(error);
      }
    },

    async completeProviderLink(request, response, next) {
      try {
        const browserBinding = readCookie(request, AUTH_BROWSER_BINDING_COOKIE);
        const result = await authService.completeProviderLink({
          provider: request.params.provider,
          code: request.query.code,
          state: request.query.state,
          browserBinding,
          sessionId: request.auth.id,
          userId: request.auth.userId,
        });
        const secure = config.nodeEnv === 'production';
        clearBrowserBinding(response, secure);
        sendData(response, result);
      } catch (error) {
        next(error);
      }
    },

    async unlinkProvider(request, response, next) {
      try {
        const result = await authService.unlinkProvider({
          provider: request.params.provider,
          userId: request.auth.userId,
        });
        sendData(response, result);
      } catch (error) {
        next(error);
      }
    },

    login(request, response, next) {
      passport.authenticate(
        'local',
        { session: false },
        async (error, user) => {
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
        },
      )(request, response, next);
    },

    getSession(request, response) {
      sendData(
        response,
        request.auth
          ? {
              authenticated: true,
              user: {
                id: request.auth.userId,
                email: request.auth.email,
                emailVerified: Boolean(request.auth.emailVerifiedAt),
              },
              csrfToken: authService.csrfToken(
                request.auth.token,
                config.csrfSecret,
              ),
            }
          : { authenticated: false, user: null, csrfToken: null },
      );
    },

    async logout(request, response, next) {
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
  };
}
