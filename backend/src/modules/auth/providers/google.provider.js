import { createRemoteJWKSet, jwtVerify } from 'jose';
import { URL, URLSearchParams } from 'node:url';
import { AppError } from '../../../common/errors/errors.js';

const GOOGLE_AUTHORIZATION_ENDPOINT =
  'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_TOKEN_ENDPOINT = 'https://oauth2.googleapis.com/token';
const GOOGLE_JWKS = createRemoteJWKSet(
  new URL('https://www.googleapis.com/oauth2/v3/certs'),
);

function providerUnavailableError() {
  return new AppError(
    503,
    'PROVIDER_UNAVAILABLE',
    'Google sign-in is temporarily unavailable.',
  );
}

function providerResponseError() {
  return new AppError(
    401,
    'PROVIDER_AUTHENTICATION_FAILED',
    'Google authentication could not be completed.',
  );
}

export function createGoogleProvider({
  googleClientId,
  googleClientSecret,
  googleRedirectUri,
  fetchImpl = globalThis.fetch,
  jwtVerifyImpl = jwtVerify,
  jwks = GOOGLE_JWKS,
} = {}) {
  return {
    authorizationUrl({ state }) {
      if (!googleClientId || !googleRedirectUri)
        throw providerUnavailableError();
      const url = new URL(GOOGLE_AUTHORIZATION_ENDPOINT);
      url.search = new URLSearchParams({
        client_id: googleClientId,
        redirect_uri: googleRedirectUri,
        response_type: 'code',
        scope: 'openid email',
        state,
        nonce: state,
        access_type: 'online',
        prompt: 'select_account',
      }).toString();
      return url.toString();
    },

    async authenticateCode({ code, nonce }) {
      if (!googleClientId || !googleClientSecret || !googleRedirectUri) {
        throw providerUnavailableError();
      }

      let response;
      try {
        response = await fetchImpl(GOOGLE_TOKEN_ENDPOINT, {
          method: 'POST',
          headers: { 'content-type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            code,
            client_id: googleClientId,
            client_secret: googleClientSecret,
            redirect_uri: googleRedirectUri,
            grant_type: 'authorization_code',
          }),
        });
      } catch {
        throw providerUnavailableError();
      }

      if (!response.ok) throw providerResponseError();
      const tokenResponse = await response.json().catch(() => null);
      if (!tokenResponse?.id_token) throw providerResponseError();

      try {
        const verified = await jwtVerifyImpl(tokenResponse.id_token, jwks, {
          issuer: ['https://accounts.google.com', 'accounts.google.com'],
          audience: googleClientId,
        });
        const claims = verified.payload;
        if (
          claims.nonce !== nonce ||
          typeof claims.sub !== 'string' ||
          typeof claims.email !== 'string' ||
          claims.email_verified !== true
        ) {
          throw providerResponseError();
        }
        return {
          subject: claims.sub,
          email: claims.email,
        };
      } catch (error) {
        if (error instanceof AppError) throw error;
        throw providerResponseError();
      }
    },
  };
}
