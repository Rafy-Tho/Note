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
    expect(result).toEqual({ id: 'user-1', email: 'user@example.com' });
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
});
