import { createHmac } from 'node:crypto';
import { URL, URLSearchParams } from 'node:url';
import { AppError } from '../../../common/errors/errors.js';

const FACEBOOK_AUTHORIZATION_ENDPOINT = 'https://www.facebook.com';
const FACEBOOK_GRAPH_ENDPOINT = 'https://graph.facebook.com';

function providerUnavailableError() {
  return new AppError(
    503,
    'PROVIDER_UNAVAILABLE',
    'Facebook sign-in is temporarily unavailable.',
  );
}

function providerResponseError() {
  return new AppError(
    401,
    'PROVIDER_AUTHENTICATION_FAILED',
    'Facebook authentication could not be completed.',
  );
}

export function createFacebookProvider({
  facebookClientId,
  facebookClientSecret,
  facebookRedirectUri,
  facebookGraphVersion = 'v20.0',
  fetchImpl = globalThis.fetch,
} = {}) {
  return {
    authorizationUrl({ state }) {
      if (!facebookClientId || !facebookRedirectUri)
        throw providerUnavailableError();
      const url = new URL(
        `${FACEBOOK_AUTHORIZATION_ENDPOINT}/${facebookGraphVersion}/dialog/oauth`,
      );
      url.search = new URLSearchParams({
        client_id: facebookClientId,
        redirect_uri: facebookRedirectUri,
        response_type: 'code',
        scope: 'email',
        state,
      }).toString();
      return url.toString();
    },

    async authenticateCode({ code }) {
      if (!facebookClientId || !facebookClientSecret || !facebookRedirectUri) {
        throw providerUnavailableError();
      }

      const tokenUrl = new URL(
        `${FACEBOOK_GRAPH_ENDPOINT}/${facebookGraphVersion}/oauth/access_token`,
      );
      tokenUrl.search = new URLSearchParams({
        client_id: facebookClientId,
        client_secret: facebookClientSecret,
        redirect_uri: facebookRedirectUri,
        code,
      }).toString();

      let tokenResponse;
      try {
        tokenResponse = await fetchImpl(tokenUrl, { method: 'GET' });
      } catch {
        throw providerUnavailableError();
      }
      if (!tokenResponse.ok) throw providerResponseError();

      const tokenPayload = await tokenResponse.json().catch(() => null);
      const accessToken = tokenPayload?.access_token;
      if (typeof accessToken !== 'string') throw providerResponseError();

      const appSecretProof = createHmac('sha256', facebookClientSecret)
        .update(accessToken)
        .digest('hex');
      const profileUrl = new URL(
        `${FACEBOOK_GRAPH_ENDPOINT}/${facebookGraphVersion}/me`,
      );
      profileUrl.search = new URLSearchParams({
        fields: 'id,email,verified',
        access_token: accessToken,
        appsecret_proof: appSecretProof,
      }).toString();

      let profileResponse;
      try {
        profileResponse = await fetchImpl(profileUrl, { method: 'GET' });
      } catch {
        throw providerUnavailableError();
      }
      if (!profileResponse.ok) throw providerResponseError();

      const profile = await profileResponse.json().catch(() => null);
      if (
        typeof profile?.id !== 'string' ||
        typeof profile.email !== 'string'
      ) {
        throw providerResponseError();
      }

      return { subject: profile.id, email: profile.email };
    },
  };
}
