import { describe, expect, it, vi } from 'vitest';
import { createAuthService } from '../../src/modules/auth/auth.service.js';
import { createGoogleProvider } from '../../src/modules/auth/google.provider.js';

const now = Date.parse('2026-09-10T00:00:00Z');

describe('authentication expansion edge cases', () => {
  it.each([
    { consumed_at: new Date(now), expires_at: new Date(now + 60_000) },
    { consumed_at: null, expires_at: new Date(now - 1) },
  ])('rejects a verification token that is consumed or expired', async (token) => {
    const repository = {
      findEmailVerificationToken: vi.fn(async () => ({
        user_id: 'user-1',
        ...token,
      })),
      consumeEmailVerificationToken: vi.fn(),
    };
    const service = createAuthService({ repository, now: () => now });

    await expect(service.verifyEmail('verification-token-value')).rejects.toMatchObject({
      code: 'VERIFICATION_TOKEN_INVALID',
    });
    expect(repository.consumeEmailVerificationToken).not.toHaveBeenCalled();
  });

  it('rejects a reset token after its attempt bound is reached', async () => {
    const repository = {
      findPasswordResetToken: vi.fn(async () => ({
        user_id: 'user-1',
        email_verified_at: new Date(now),
        password_hash: 'old-hash',
        consumed_at: null,
        attempt_count: 5,
        expires_at: new Date(now + 60_000),
      })),
    };
    const password = { argon2id: 'argon2id', hash: vi.fn() };
    const service = createAuthService({ repository, password, now: () => now });

    await expect(
      service.resetPassword('password-reset-token-value', 'new-password'),
    ).rejects.toMatchObject({ code: 'PASSWORD_RESET_TOKEN_INVALID' });
    expect(password.hash).not.toHaveBeenCalled();
  });

  it('rejects a reset token that was already consumed', async () => {
    const repository = {
      findPasswordResetToken: vi.fn(async () => ({
        user_id: 'user-1',
        email_verified_at: new Date(now),
        password_hash: 'old-hash',
        consumed_at: new Date(now),
        attempt_count: 0,
        expires_at: new Date(now + 60_000),
      })),
    };
    const service = createAuthService({ repository, now: () => now });

    await expect(
      service.resetPassword('password-reset-token-value', 'new-password'),
    ).rejects.toMatchObject({ code: 'PASSWORD_RESET_TOKEN_INVALID' });
  });

  it('does not retry a provider callback with a missing or invalid state', async () => {
    const repository = {
      consumeAuthCallbackState: vi.fn(async () => null),
    };
    const authenticateCode = vi.fn();
    const service = createAuthService({
      repository,
      googleProvider: { authenticateCode },
      transaction: vi.fn(async (work) => work({})),
    });

    await expect(
      service.completeGoogleSignIn({
        code: 'authorization-code',
        state: 'callback-state-value',
        browserBinding: 'browser-binding',
      }),
    ).rejects.toMatchObject({ code: 'PROVIDER_CALLBACK_INVALID' });
    expect(authenticateCode).not.toHaveBeenCalled();
  });

  it('validates Google issuer, audience, nonce, and verified email claims', async () => {
    const fetchImpl = vi.fn(async () => ({ ok: true, json: async () => ({ id_token: 'id-token' }) }));
    const jwtVerifyImpl = vi.fn(async () => ({
      payload: {
        iss: 'https://accounts.google.com',
        aud: 'google-client',
        nonce: 'expected-nonce',
        sub: 'google-subject',
        email: 'user@example.com',
        email_verified: true,
      },
    }));
    const provider = createGoogleProvider({
      googleClientId: 'google-client',
      googleClientSecret: 'google-secret',
      googleRedirectUri: 'http://localhost/callback',
      fetchImpl,
      jwtVerifyImpl,
      jwks: {},
    });

    await expect(provider.authenticateCode({ code: 'code', nonce: 'expected-nonce' })).resolves.toEqual({
      subject: 'google-subject',
      email: 'user@example.com',
    });
    expect(jwtVerifyImpl).toHaveBeenCalledWith(
      'id-token',
      {},
      expect.objectContaining({
        audience: 'google-client',
        issuer: ['https://accounts.google.com', 'accounts.google.com'],
      }),
    );
  });
});
