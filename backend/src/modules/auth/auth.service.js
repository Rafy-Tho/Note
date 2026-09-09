import argon2 from 'argon2';
import { Buffer } from 'node:buffer';
import {
  createHash,
  createHmac,
  randomBytes,
  timingSafeEqual,
} from 'node:crypto';
import { withTransaction } from '../../db/transaction.js';
import { AppError } from '../../common/errors.js';
import {
  ABSOLUTE_TIMEOUT_MS,
  IDLE_TIMEOUT_MS,
  SESSION_TOKEN_BYTES,
  publicUser,
} from './auth.constants.js';
import { normalizeEmail } from './auth.validation.js';

const invalidCredentialsError = () =>
  new AppError(401, 'AUTHENTICATION_FAILED', 'Invalid email or password.');

function tokenHash(token) {
  return createHash('sha256').update(token).digest('hex');
}

function sessionExpiry(now = Date.now()) {
  return new Date(now + IDLE_TIMEOUT_MS);
}

function absoluteExpiry(createdAt) {
  return new Date(new Date(createdAt).getTime() + ABSOLUTE_TIMEOUT_MS);
}

export function createAuthService({
  repository,
  transaction = withTransaction,
  password = argon2,
} = {}) {
  return {
    async register({ email, password: plaintext }) {
      const passwordHash = await password.hash(plaintext, {
        type: password.argon2id,
      });
      try {
        return await transaction(async (client) => {
          const user = await repository.createUser(client, email, passwordHash);
          return publicUser(user);
        });
      } catch (error) {
        if (error?.code === '23505') {
          throw new AppError(
            409,
            'DUPLICATE_EMAIL',
            'An account with that email already exists.',
          );
        }
        throw error;
      }
    },

    async verifyCredentials({ email, password: plaintext }) {
      const user = await repository.findUserByEmail(email);
      if (!user) throw invalidCredentialsError();
      const valid = await password.verify(user.password_hash, plaintext);
      if (!valid) throw invalidCredentialsError();
      return user;
    },

    async createSession(userId, now = Date.now()) {
      const token = randomBytes(SESSION_TOKEN_BYTES).toString('base64url');
      const session = await transaction(async (client) =>
        repository.createSession(client, {
          userId,
          tokenHash: tokenHash(token),
          expiresAt: sessionExpiry(now),
        }),
      );
      return { token, session };
    },

    async authenticateToken(token, now = Date.now()) {
      if (!token || typeof token !== 'string') return null;
      const session = await repository.findSession(tokenHash(token));
      if (!session || session.revoked_at) return null;

      const absolute = absoluteExpiry(session.created_at);
      if (
        new Date(now) >= absolute ||
        new Date(session.expires_at) <= new Date(now)
      )
        return null;

      const nextExpiry = new Date(
        Math.min(now + IDLE_TIMEOUT_MS, absolute.getTime()),
      );
      await repository.touchSession(session.id, nextExpiry);
      return {
        id: session.id,
        userId: session.user_id,
        email: session.email,
        createdAt: session.created_at,
        csrfToken: this.csrfToken(token),
      };
    },

    async revokeSession(token) {
      if (token) await repository.revokeSession(tokenHash(token));
    },

    csrfToken(token, secret = '') {
      return createHmac('sha256', secret).update(token).digest('hex');
    },

    csrfMatches(token, csrf, secret = '') {
      if (!token || !csrf || typeof csrf !== 'string') return false;
      const expected = Buffer.from(this.csrfToken(token, secret));
      const received = Buffer.from(csrf);
      return (
        expected.length === received.length &&
        timingSafeEqual(expected, received)
      );
    },

    normalizeEmail,
  };
}
