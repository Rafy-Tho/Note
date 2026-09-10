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
  EMAIL_VERIFICATION_TOKEN_BYTES,
  EMAIL_VERIFICATION_TTL_MS,
  IDLE_TIMEOUT_MS,
  PASSWORD_RESET_MAX_ATTEMPTS,
  PASSWORD_RESET_TTL_MS,
  PASSWORD_RESET_TOKEN_BYTES,
  SESSION_TOKEN_BYTES,
  publicUser,
} from './auth.constants.js';
import { createOpaqueToken, hashOpaqueToken } from './auth.tokens.js';
import { normalizeEmail } from './auth.validation.js';

const invalidCredentialsError = () =>
  new AppError(401, 'AUTHENTICATION_FAILED', 'Invalid email or password.');

const invalidVerificationTokenError = () =>
  new AppError(
    400,
    'VERIFICATION_TOKEN_INVALID',
    'The verification link is invalid or expired.',
  );

const invalidPasswordResetTokenError = () =>
  new AppError(
    400,
    'PASSWORD_RESET_TOKEN_INVALID',
    'The password reset link is invalid or expired.',
  );

const acceptedVerificationResponse = () => ({ accepted: true });

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
  mailService = {
    sendVerificationEmail: async () => {},
    sendPasswordResetEmail: async () => {},
  },
  now = () => Date.now(),
} = {}) {
  async function createVerificationChallenge(client, user) {
    if (!repository.createEmailVerificationToken) return null;
    const token = createOpaqueToken(EMAIL_VERIFICATION_TOKEN_BYTES);
    await repository.invalidateVerificationTokens(client, user.id);
    await repository.createEmailVerificationToken(client, {
      userId: user.id,
      tokenHash: hashOpaqueToken(token),
      expiresAt: new Date(now() + EMAIL_VERIFICATION_TTL_MS),
    });
    return token;
  }

  async function sendVerification(user, token) {
    if (token) {
      await mailService.sendVerificationEmail({ to: user.email, token });
    }
  }

  async function createPasswordResetChallenge(client, user) {
    if (!repository.createPasswordResetToken) return null;
    const token = createOpaqueToken(PASSWORD_RESET_TOKEN_BYTES);
    await repository.invalidatePasswordResetTokens(client, user.id);
    await repository.createPasswordResetToken(client, {
      userId: user.id,
      tokenHash: hashOpaqueToken(token),
      expiresAt: new Date(now() + PASSWORD_RESET_TTL_MS),
    });
    return token;
  }

  return {
    async register({ email, password: plaintext }) {
      const passwordHash = await password.hash(plaintext, {
        type: password.argon2id,
      });
      try {
        const result = await transaction(async (client) => {
          const user = await repository.createUser(client, email, passwordHash);
          const token = await createVerificationChallenge(client, user);
          return { user, token };
        });
        await sendVerification(result.user, result.token);
        return publicUser(result.user);
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
      if (!user || !user.password_hash) throw invalidCredentialsError();
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
        emailVerifiedAt: session.email_verified_at,
        createdAt: session.created_at,
        csrfToken: this.csrfToken(token),
      };
    },

    async revokeSession(token) {
      if (token) await repository.revokeSession(tokenHash(token));
    },

    async requestEmailVerification(email) {
      const user = await repository.findUserByEmail(email);
      if (!user || user.email_verified_at)
        return acceptedVerificationResponse();

      const result = await transaction(async (client) => ({
        user,
        token: await createVerificationChallenge(client, user),
      }));
      await sendVerification(result.user, result.token);
      return acceptedVerificationResponse();
    },

    async verifyEmail(token) {
      if (typeof token !== 'string' || token.length < 20)
        throw invalidVerificationTokenError();

      const verification = await repository.findEmailVerificationToken(
        hashOpaqueToken(token),
      );
      if (
        !verification ||
        verification.consumed_at ||
        new Date(verification.expires_at) <= new Date(now())
      ) {
        throw invalidVerificationTokenError();
      }

      const user = await transaction(async (client) => {
        const consumed = await repository.consumeEmailVerificationToken(
          client,
          hashOpaqueToken(token),
          verification.user_id,
        );
        if (!consumed) throw invalidVerificationTokenError();
        return repository.markEmailVerified(client, verification.user_id);
      });

      return publicUser(user);
    },

    async requestPasswordReset(email) {
      const user = await repository.findUserByEmail(email);
      if (!user || !user.email_verified_at || !user.password_hash)
        return acceptedVerificationResponse();

      const result = await transaction(async (client) => ({
        user,
        token: await createPasswordResetChallenge(client, user),
      }));
      if (result.token) {
        await mailService.sendPasswordResetEmail({
          to: result.user.email,
          token: result.token,
        });
      }
      return acceptedVerificationResponse();
    },

    async resetPassword(token, plaintext) {
      if (typeof token !== 'string' || token.length < 20)
        throw invalidPasswordResetTokenError();

      const tokenHashValue = hashOpaqueToken(token);
      const reset = await repository.findPasswordResetToken(tokenHashValue);
      if (
        !reset ||
        reset.consumed_at ||
        !reset.email_verified_at ||
        !reset.password_hash ||
        reset.attempt_count >= PASSWORD_RESET_MAX_ATTEMPTS ||
        new Date(reset.expires_at) <= new Date(now())
      ) {
        throw invalidPasswordResetTokenError();
      }

      const passwordHash = await password.hash(plaintext, {
        type: password.argon2id,
      });
      const user = await transaction(async (client) => {
        const consumed = await repository.consumePasswordResetToken(
          client,
          tokenHashValue,
          reset.user_id,
          PASSWORD_RESET_MAX_ATTEMPTS,
        );
        if (!consumed) throw invalidPasswordResetTokenError();
        const updatedUser = await repository.updatePasswordHash(
          client,
          reset.user_id,
          passwordHash,
        );
        await repository.revokeAllSessions(client, reset.user_id);
        return updatedUser;
      });

      return publicUser(user);
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
