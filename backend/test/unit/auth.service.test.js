import { describe, expect, it, vi } from 'vitest';
import { createAuthService } from '../../src/modules/auth/auth.service.js';

describe('authentication service', () => {
  it('hashes the password and returns only public user fields on registration', async () => {
    const repository = {
      createUser: vi.fn(async () => ({
        id: 'user-1',
        email: 'user@example.com',
        password_hash: 'hidden',
      })),
    };
    const password = {
      argon2id: 'argon2id',
      hash: vi.fn(async () => 'argon-hash'),
    };
    const transaction = vi.fn(async (work) => work({}));
    const service = createAuthService({ repository, password, transaction });

    const result = await service.register({
      email: 'user@example.com',
      password: 'correct-password',
    });

    expect(password.hash).toHaveBeenCalledWith('correct-password', {
      type: 'argon2id',
    });
    expect(repository.createUser).toHaveBeenCalledWith(
      {},
      'user@example.com',
      'argon-hash',
    );
    expect(result).toEqual({
      id: 'user-1',
      email: 'user@example.com',
      emailVerified: false,
    });
    expect(result).not.toHaveProperty('password_hash');
  });

  it('rejects expired sessions and accepts sessions within the idle timeout', async () => {
    const repository = {
      findSession: vi.fn(async () => ({
        id: 'session-1',
        user_id: 'user-1',
        email: 'user@example.com',
        created_at: new Date('2026-01-01T00:00:00Z'),
        expires_at: new Date('2026-01-07T00:00:00Z'),
        revoked_at: null,
      })),
      touchSession: vi.fn(),
    };
    const service = createAuthService({ repository });

    const active = await service.authenticateToken(
      'opaque-token',
      Date.parse('2026-01-03T00:00:00Z'),
    );
    expect(active).toMatchObject({
      userId: 'user-1',
      email: 'user@example.com',
    });
    expect(repository.touchSession).toHaveBeenCalledOnce();

    const expired = await service.authenticateToken(
      'opaque-token',
      Date.parse('2026-01-08T00:00:00Z'),
    );
    expect(expired).toBeNull();
  });

  it('compares CSRF tokens without treating an invalid token as valid', () => {
    const service = createAuthService({});
    const token = service.csrfToken('opaque-token', 'csrf-secret');

    expect(service.csrfMatches('opaque-token', token, 'csrf-secret')).toBe(
      true,
    );
    expect(
      service.csrfMatches('opaque-token', 'wrong-token', 'csrf-secret'),
    ).toBe(false);
  });

  it('creates and sends an email verification challenge during registration', async () => {
    const repository = {
      createUser: vi.fn(async () => ({
        id: 'user-1',
        email: 'user@example.com',
        email_verified_at: null,
      })),
      invalidateVerificationTokens: vi.fn(),
      createEmailVerificationToken: vi.fn(),
    };
    const mailService = { sendVerificationEmail: vi.fn() };
    const password = {
      argon2id: 'argon2id',
      hash: vi.fn(async () => 'argon-hash'),
    };
    const transaction = vi.fn(async (work) => work({}));
    const service = createAuthService({
      repository,
      password,
      transaction,
      mailService,
      now: () => Date.parse('2026-09-10T00:00:00Z'),
    });

    await service.register({
      email: 'user@example.com',
      password: 'correct-password',
    });

    expect(repository.createEmailVerificationToken).toHaveBeenCalledWith(
      {},
      expect.objectContaining({
        userId: 'user-1',
        expiresAt: new Date('2026-09-11T00:00:00Z'),
      }),
    );
    expect(mailService.sendVerificationEmail).toHaveBeenCalledWith({
      to: 'user@example.com',
      token: expect.any(String),
    });
  });

  it('consumes a valid verification token and marks the user verified', async () => {
    const repository = {
      findEmailVerificationToken: vi.fn(async () => ({
        user_id: 'user-1',
        email: 'user@example.com',
        expires_at: new Date('2026-09-11T00:00:00Z'),
        consumed_at: null,
      })),
      consumeEmailVerificationToken: vi.fn(async () => true),
      markEmailVerified: vi.fn(async () => ({
        id: 'user-1',
        email: 'user@example.com',
        email_verified_at: new Date('2026-09-10T00:00:00Z'),
      })),
    };
    const service = createAuthService({
      repository,
      transaction: vi.fn(async (work) => work({})),
      now: () => Date.parse('2026-09-10T00:00:00Z'),
    });

    const result = await service.verifyEmail('verification-token-value');

    expect(result).toEqual({
      id: 'user-1',
      email: 'user@example.com',
      emailVerified: true,
    });
    expect(repository.consumeEmailVerificationToken).toHaveBeenCalledOnce();
    expect(repository.markEmailVerified).toHaveBeenCalledWith({}, 'user-1');
  });

  it('sends a reset message only for verified password accounts', async () => {
    const repository = {
      findUserByEmail: vi.fn(async () => ({
        id: 'user-1',
        email: 'user@example.com',
        password_hash: 'existing-hash',
        email_verified_at: new Date('2026-09-10T00:00:00Z'),
      })),
      invalidatePasswordResetTokens: vi.fn(),
      createPasswordResetToken: vi.fn(),
    };
    const mailService = { sendPasswordResetEmail: vi.fn() };
    const service = createAuthService({
      repository,
      transaction: vi.fn(async (work) => work({})),
      mailService,
      now: () => Date.parse('2026-09-10T00:00:00Z'),
    });

    const result = await service.requestPasswordReset('user@example.com');

    expect(result).toEqual({ accepted: true });
    expect(repository.createPasswordResetToken).toHaveBeenCalledWith(
      {},
      expect.objectContaining({
        userId: 'user-1',
        expiresAt: new Date('2026-09-10T01:00:00Z'),
      }),
    );
    expect(mailService.sendPasswordResetEmail).toHaveBeenCalledWith({
      to: 'user@example.com',
      token: expect.any(String),
    });
  });

  it('replaces the password and revokes all sessions after reset', async () => {
    const repository = {
      findPasswordResetToken: vi.fn(async () => ({
        user_id: 'user-1',
        email: 'user@example.com',
        email_verified_at: new Date('2026-09-10T00:00:00Z'),
        password_hash: 'old-hash',
        expires_at: new Date('2026-09-10T01:00:00Z'),
        consumed_at: null,
        attempt_count: 0,
      })),
      consumePasswordResetToken: vi.fn(async () => true),
      updatePasswordHash: vi.fn(async () => ({
        id: 'user-1',
        email: 'user@example.com',
        email_verified_at: new Date('2026-09-10T00:00:00Z'),
      })),
      revokeAllSessions: vi.fn(),
    };
    const password = {
      argon2id: 'argon2id',
      hash: vi.fn(async () => 'new-hash'),
    };
    const service = createAuthService({
      repository,
      password,
      transaction: vi.fn(async (work) => work({})),
      now: () => Date.parse('2026-09-10T00:00:00Z'),
    });

    const result = await service.resetPassword(
      'password-reset-token-value',
      'new-correct-password',
    );

    expect(password.hash).toHaveBeenCalledWith('new-correct-password', {
      type: 'argon2id',
    });
    expect(repository.updatePasswordHash).toHaveBeenCalledWith(
      {},
      'user-1',
      'new-hash',
    );
    expect(repository.revokeAllSessions).toHaveBeenCalledWith({}, 'user-1');
    expect(result).toEqual({
      id: 'user-1',
      email: 'user@example.com',
      emailVerified: true,
    });
  });

  it('does not send reset mail or create a password for provider-only accounts', async () => {
    const repository = {
      findUserByEmail: vi.fn(async () => ({
        id: 'user-1',
        email: 'user@example.com',
        password_hash: null,
        email_verified_at: new Date('2026-09-10T00:00:00Z'),
      })),
      createPasswordResetToken: vi.fn(),
    };
    const mailService = { sendPasswordResetEmail: vi.fn() };
    const service = createAuthService({ repository, mailService });

    expect(await service.requestPasswordReset('user@example.com')).toEqual({
      accepted: true,
    });
    expect(repository.createPasswordResetToken).not.toHaveBeenCalled();
    expect(mailService.sendPasswordResetEmail).not.toHaveBeenCalled();
  });

  it('rejects an invalid reset token without hashing a password', async () => {
    const repository = {
      findPasswordResetToken: vi.fn(async () => null),
    };
    const password = {
      argon2id: 'argon2id',
      hash: vi.fn(),
    };
    const service = createAuthService({ repository, password });

    await expect(
      service.resetPassword(
        'password-reset-token-value',
        'new-correct-password',
      ),
    ).rejects.toMatchObject({ code: 'PASSWORD_RESET_TOKEN_INVALID' });
    expect(password.hash).not.toHaveBeenCalled();
  });

  it('creates callback state and resolves a new Google identity into a session', async () => {
    const repository = {
      createAuthCallbackState: vi.fn(),
      findIdentity: vi.fn(async () => null),
      findUserByEmail: vi.fn(async () => null),
      createExternalUser: vi.fn(async () => ({
        id: 'user-1',
        email: 'user@example.com',
        password_hash: null,
        email_verified_at: new Date('2026-09-10T00:00:00Z'),
      })),
      createIdentity: vi.fn(),
      consumeAuthCallbackState: vi.fn(async () => ({ id: 'state-1' })),
      createSession: vi.fn(async () => ({ id: 'session-1' })),
    };
    const googleProvider = {
      authorizationUrl: vi.fn(() => 'https://accounts.google.com/auth'),
      authenticateCode: vi.fn(async () => ({
        subject: 'google-subject',
        email: 'user@example.com',
      })),
    };
    const service = createAuthService({
      repository,
      googleProvider,
      transaction: vi.fn(async (work) => work({})),
      now: () => Date.parse('2026-09-10T00:00:00Z'),
    });

    await expect(
      service.startGoogleSignIn({ browserBinding: 'browser-binding' }),
    ).resolves.toBe('https://accounts.google.com/auth');
    const result = await service.completeGoogleSignIn({
      code: 'authorization-code',
      state: 'callback-state-value',
      browserBinding: 'browser-binding',
    });

    expect(repository.createExternalUser).toHaveBeenCalledWith(
      {},
      'user@example.com',
    );
    expect(repository.createIdentity).toHaveBeenCalledWith(
      {},
      expect.objectContaining({
        userId: 'user-1',
        provider: 'google',
        providerSubject: 'google-subject',
      }),
    );
    expect(result.user).toEqual({
      id: 'user-1',
      email: 'user@example.com',
      emailVerified: true,
    });
    expect(result.token).toBeTruthy();
  });

  it('does not merge a Google identity into an existing email account', async () => {
    const repository = {
      consumeAuthCallbackState: vi.fn(async () => ({ id: 'state-1' })),
      findIdentity: vi.fn(async () => null),
      findUserByEmail: vi.fn(async () => ({
        id: 'existing-user',
        email: 'user@example.com',
      })),
      createExternalUser: vi.fn(),
    };
    const service = createAuthService({
      repository,
      googleProvider: {
        authenticateCode: vi.fn(async () => ({
          subject: 'google-subject',
          email: 'user@example.com',
        })),
      },
      transaction: vi.fn(async (work) => work({})),
    });

    await expect(
      service.completeGoogleSignIn({
        code: 'authorization-code',
        state: 'callback-state-value',
        browserBinding: 'browser-binding',
      }),
    ).rejects.toMatchObject({ code: 'PROVIDER_LINK_REQUIRED' });
    expect(repository.createExternalUser).not.toHaveBeenCalled();
  });
});
