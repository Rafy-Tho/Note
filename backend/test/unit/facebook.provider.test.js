import { URL } from 'node:url';
import { describe, expect, it, vi } from 'vitest';
import { createFacebookProvider } from '../../src/modules/auth/providers/facebook.provider.js';

const providerConfig = {
  facebookClientId: 'facebook-client-id',
  facebookClientSecret: 'facebook-client-secret',
  facebookRedirectUri: 'https://api.example.com/api/v1/auth/facebook/callback',
  facebookGraphVersion: 'v20.0',
};

describe('Facebook provider', () => {
  it('builds an authorization URL with state', () => {
    const provider = createFacebookProvider(providerConfig);
    const url = new URL(provider.authorizationUrl({ state: 'one-time-state' }));

    expect(url.origin + url.pathname).toBe(
      'https://www.facebook.com/v20.0/dialog/oauth',
    );
    expect(url.searchParams.get('client_id')).toBe('facebook-client-id');
    expect(url.searchParams.get('state')).toBe('one-time-state');
    expect(url.searchParams.get('scope')).toBe('email');
  });

  it('supports a separate redirect URI for provider linking', () => {
    const provider = createFacebookProvider(providerConfig);
    const url = new URL(
      provider.authorizationUrl({
        state: 'link-state',
        redirectUri:
          'https://api.example.com/api/v1/auth/facebook/link/callback',
      }),
    );

    expect(url.searchParams.get('redirect_uri')).toBe(
      'https://api.example.com/api/v1/auth/facebook/link/callback',
    );
  });

  it('exchanges the code and validates the verified Graph profile', async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ access_token: 'user-access-token' }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 'facebook-subject',
          email: 'user@example.com',
          verified: true,
        }),
      });
    const provider = createFacebookProvider({ ...providerConfig, fetchImpl });

    await expect(
      provider.authenticateCode({ code: 'authorization-code' }),
    ).resolves.toEqual({
      subject: 'facebook-subject',
      email: 'user@example.com',
      emailVerified: true,
    });
    expect(fetchImpl).toHaveBeenCalledTimes(2);
    expect(fetchImpl.mock.calls[0][0].searchParams.get('redirect_uri')).toBe(
      'https://api.example.com/api/v1/auth/facebook/callback',
    );
    expect(
      fetchImpl.mock.calls[1][0].searchParams.get('appsecret_proof'),
    ).toEqual(expect.any(String));
  });

  it('returns an unverified Facebook email for explicit linking policy', async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ access_token: 'user-access-token' }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 'facebook-subject',
          email: 'user@example.com',
          verified: false,
        }),
      });
    const provider = createFacebookProvider({ ...providerConfig, fetchImpl });

    await expect(
      provider.authenticateCode({ code: 'authorization-code' }),
    ).resolves.toEqual({
      subject: 'facebook-subject',
      email: 'user@example.com',
      emailVerified: false,
    });
  });

  it('returns a provider subject when Facebook omits an email', async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ access_token: 'user-access-token' }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 'facebook-subject' }),
      });
    const provider = createFacebookProvider({ ...providerConfig, fetchImpl });

    await expect(
      provider.authenticateCode({ code: 'authorization-code' }),
    ).resolves.toEqual({
      subject: 'facebook-subject',
      email: null,
      emailVerified: false,
    });
  });
});
