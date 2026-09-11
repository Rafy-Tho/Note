import { describe, expect, it, vi } from 'vitest';
import { URL } from 'node:url';
import { createGoogleProvider } from '../../src/modules/auth/providers/google.provider.js';

const providerConfig = {
  googleClientId: 'google-client-id',
  googleClientSecret: 'google-client-secret',
  googleRedirectUri: 'https://api.example.com/api/v1/auth/google/callback',
};

describe('Google provider', () => {
  it('builds an authorization URL with state and nonce', () => {
    const provider = createGoogleProvider(providerConfig);
    const url = new URL(provider.authorizationUrl({ state: 'one-time-state' }));

    expect(url.origin + url.pathname).toBe(
      'https://accounts.google.com/o/oauth2/v2/auth',
    );
    expect(url.searchParams.get('client_id')).toBe('google-client-id');
    expect(url.searchParams.get('state')).toBe('one-time-state');
    expect(url.searchParams.get('nonce')).toBe('one-time-state');
  });

  it('supports a separate redirect URI for provider linking', () => {
    const provider = createGoogleProvider(providerConfig);
    const url = new URL(
      provider.authorizationUrl({
        state: 'link-state',
        redirectUri: 'https://api.example.com/api/v1/auth/google/link/callback',
      }),
    );

    expect(url.searchParams.get('redirect_uri')).toBe(
      'https://api.example.com/api/v1/auth/google/link/callback',
    );
  });

  it('exchanges the code and validates the verified ID-token claims', async () => {
    const fetchImpl = vi.fn(async () => ({
      ok: true,
      json: async () => ({ id_token: 'signed-id-token' }),
    }));
    const jwtVerifyImpl = vi.fn(async () => ({
      payload: {
        sub: 'google-subject',
        email: 'user@example.com',
        email_verified: true,
        nonce: 'one-time-state',
      },
    }));
    const provider = createGoogleProvider({
      ...providerConfig,
      fetchImpl,
      jwtVerifyImpl,
      jwks: {},
    });

    await expect(
      provider.authenticateCode({
        code: 'authorization-code',
        nonce: 'one-time-state',
      }),
    ).resolves.toEqual({
      subject: 'google-subject',
      email: 'user@example.com',
      emailVerified: true,
    });
    expect(fetchImpl).toHaveBeenCalledWith(
      'https://oauth2.googleapis.com/token',
      expect.objectContaining({ method: 'POST' }),
    );
    expect(fetchImpl.mock.calls[0][1].body.get('redirect_uri')).toBe(
      'https://api.example.com/api/v1/auth/google/callback',
    );
    expect(jwtVerifyImpl).toHaveBeenCalledWith(
      'signed-id-token',
      {},
      expect.objectContaining({ audience: 'google-client-id' }),
    );
  });

  it('rejects an unverified or nonce-mismatched identity', async () => {
    const provider = createGoogleProvider({
      ...providerConfig,
      fetchImpl: vi.fn(async () => ({
        ok: true,
        json: async () => ({ id_token: 'signed-id-token' }),
      })),
      jwtVerifyImpl: vi.fn(async () => ({
        payload: {
          sub: 'google-subject',
          email: 'user@example.com',
          email_verified: false,
          nonce: 'different-state',
        },
      })),
      jwks: {},
    });

    await expect(
      provider.authenticateCode({ code: 'authorization-code', nonce: 'state' }),
    ).rejects.toMatchObject({
      code: 'PROVIDER_AUTHENTICATION_FAILED',
    });
  });
});
