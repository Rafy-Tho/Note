import { URL } from 'node:url';
import { sendData } from '../../common/utils/response.js';
import { AppError } from '../../common/errors/errors.js';
import { assertObject } from '../../common/validation/validation.js';
import { publicUser } from './auth.constants.js';
import { AUTH_BROWSER_BINDING_COOKIE } from './auth.constants.js';
import { createOpaqueToken } from './auth.tokens.js';
import { getCookieSecurity, readCookie } from './auth.middleware.js';
import {
  validateCredentials,
  validateEmailBody,
  validateOAuthCallback,
  validatePasswordResetBody,
  validateVerificationCodeBody,
} from './auth.validation.js';

function setSessionCookie(response, name, token, config) {
  response.cookie(name, token, {
    httpOnly: true,
    ...getCookieSecurity(config),
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
}

function getOrSetBrowserBinding(request, response, config) {
  const existing = readCookie(request, AUTH_BROWSER_BINDING_COOKIE);
  if (existing) return existing;

  const binding = createOpaqueToken();
  response.cookie(AUTH_BROWSER_BINDING_COOKIE, binding, {
    httpOnly: true,
    ...getCookieSecurity(config),
    maxAge: 10 * 60 * 1000,
  });
  return binding;
}

function clearBrowserBinding(response, config) {
  response.clearCookie(AUTH_BROWSER_BINDING_COOKIE, {
    httpOnly: true,
    ...getCookieSecurity(config),
  });
}

function redirectProviderFailure(request, response, config, error) {
  if (!request.get('accept')?.includes('text/html')) return false;
  const code = error.code ?? 'PROVIDER_CALLBACK_INVALID';
  const redirect = new URL(
    request.auth ? '/workspace/notes' : '/login',
    config.appUrl ?? 'http://localhost:5173',
  );
  redirect.searchParams.set('authError', code);
  response.redirect(redirect.toString());
  return true;
}

function providerRedirect(config, provider) {
  const redirect = new URL(
    '/workspace/notes',
    config.appUrl ?? 'http://localhost:5173',
  );
  redirect.searchParams.set('authLinked', provider);
  return redirect.toString();
}

function providerSignInRedirect(config) {
  return new URL(
    '/workspace/notes',
    config.appUrl ?? 'http://localhost:5173',
  ).toString();
}

async function completeProviderSignInCallback({
  request,
  response,
  next,
  authService,
  config,
  complete,
}) {
  try {
    const browserBinding = readCookie(request, AUTH_BROWSER_BINDING_COOKIE);
    const callback = validateOAuthCallback(request.query);
    const result = await complete({
      code: callback.code,
      state: callback.state,
      browserBinding,
      sessionId: request.auth?.id,
      userId: request.auth?.userId,
    });
    clearBrowserBinding(response, config);

    if (result.purpose === 'link') {
      if (request.get('accept')?.includes('text/html')) {
        response.redirect(providerRedirect(config, result.provider));
        return;
      }
      sendData(response, { provider: result.provider });
      return;
    }

    setSessionCookie(response, config.sessionCookieName, result.token, config);
    if (request.get('accept')?.includes('text/html')) {
      response.redirect(providerSignInRedirect(config));
      return;
    }
    sendData(response, {
      authenticated: true,
      user: result.user,
      csrfToken: authService.csrfToken(result.token, config.csrfSecret),
    });
  } catch (error) {
    if (!redirectProviderFailure(request, response, config, error)) next(error);
  }
}

export function createAuthController({ authService, config }) {
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
        const code = validateVerificationCodeBody(request.body);
        const result = await authService.verifyEmailAndCreateSession(code);
        setSessionCookie(
          response,
          config.sessionCookieName,
          result.token,
          config,
        );
        sendData(response, {
          authenticated: true,
          user: result.user,
          csrfToken: authService.csrfToken(result.token, config.csrfSecret),
        });
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
        const browserBinding = getOrSetBrowserBinding(
          request,
          response,
          config,
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
      return completeProviderSignInCallback({
        request,
        response,
        next,
        authService,
        config,
        complete: (params) => authService.completeGoogleSignIn(params),
      });
    },

    async startFacebookSignIn(request, response, next) {
      try {
        const browserBinding = getOrSetBrowserBinding(
          request,
          response,
          config,
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
      return completeProviderSignInCallback({
        request,
        response,
        next,
        authService,
        config,
        complete: (params) => authService.completeFacebookSignIn(params),
      });
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
        const browserBinding = getOrSetBrowserBinding(
          request,
          response,
          config,
        );
        const authorizationUrl = await authService.startProviderLink({
          provider: request.params.provider,
          browserBinding,
          sessionId: request.auth.id,
          userId: request.auth.userId,
        });
        sendData(response, { authorizationUrl });
      } catch (error) {
        next(error);
      }
    },

    async completeProviderLink(request, response, next) {
      try {
        const browserBinding = readCookie(request, AUTH_BROWSER_BINDING_COOKIE);
        const callback = validateOAuthCallback(request.query);
        const result = await authService.completeProviderLink({
          provider: request.params.provider,
          code: callback.code,
          state: callback.state,
          browserBinding,
          sessionId: request.auth.id,
          userId: request.auth.userId,
        });
        clearBrowserBinding(response, config);
        if (request.get('accept')?.includes('text/html')) {
          response.redirect(providerRedirect(config, result.provider));
          return;
        }
        sendData(response, result);
      } catch (error) {
        if (!redirectProviderFailure(request, response, config, error))
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

    async login(request, response, next) {
      try {
        assertObject(request.body);
        const credentials = validateCredentials(request.body);
        const user = await authService.verifyCredentials(credentials);
        if (!user)
          throw new AppError(
            401,
            'AUTHENTICATION_FAILED',
            'Invalid email or password.',
          );
        const { token } = await authService.createSession(user.id);
        setSessionCookie(response, config.sessionCookieName, token, config);
        sendData(response, {
          authenticated: true,
          user: publicUser(user),
          csrfToken: authService.csrfToken(token, config.csrfSecret),
        });
      } catch (error) {
        next(error);
      }
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
          ...getCookieSecurity(config),
        });
        response.status(204).send();
      } catch (error) {
        next(error);
      }
    },
  };
}
