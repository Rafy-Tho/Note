import { describe, expect, it } from 'vitest';
import { getConfig } from '../../src/config/env.js';

const validEnvironment = {
  NODE_ENV: 'test',
  PORT: '3000',
  DATABASE_URL: 'postgres://localhost/note_app',
  SESSION_SECRET: 'session-secret',
  CSRF_SECRET: 'csrf-secret',
};

describe('getConfig', () => {
  it('returns normalized application configuration', () => {
    expect(getConfig(validEnvironment)).toEqual({
      nodeEnv: 'test',
      port: 3000,
      databaseUrl: validEnvironment.DATABASE_URL,
      sessionSecret: 'session-secret',
      sessionCookieName: 'note_app_session',
      csrfSecret: 'csrf-secret',
      corsOrigin: '',
      resendApiKey: '',
      mailFromAddress: '',
      appUrl: 'http://localhost:5173',
      googleClientId: '',
      googleClientSecret: '',
      googleRedirectUri: '',
      facebookClientId: '',
      facebookClientSecret: '',
      facebookRedirectUri: '',
      facebookGraphVersion: 'v20.0',
    });
  });

  it('rejects missing production configuration', () => {
    expect(() => getConfig({ NODE_ENV: 'production' })).toThrow(
      'Invalid application configuration.',
    );

    try {
      getConfig({ NODE_ENV: 'production' });
    } catch (error) {
      expect(error.code).toBe('CONFIGURATION_ERROR');
      expect(error.fields).toEqual({
        DATABASE_URL: 'DATABASE_URL is required.',
        SESSION_SECRET: 'SESSION_SECRET is required outside development.',
        CSRF_SECRET: 'CSRF_SECRET is required outside development.',
        RESEND_API_KEY: 'RESEND_API_KEY is required in production.',
        MAIL_FROM_ADDRESS: 'MAIL_FROM_ADDRESS is required in production.',
        APP_URL: 'APP_URL is required in production.',
        GOOGLE_CLIENT_ID: 'GOOGLE_CLIENT_ID is required in production.',
        GOOGLE_CLIENT_SECRET: 'GOOGLE_CLIENT_SECRET is required in production.',
        GOOGLE_REDIRECT_URI: 'GOOGLE_REDIRECT_URI is required in production.',
        FACEBOOK_CLIENT_ID: 'FACEBOOK_CLIENT_ID is required in production.',
        FACEBOOK_CLIENT_SECRET:
          'FACEBOOK_CLIENT_SECRET is required in production.',
        FACEBOOK_REDIRECT_URI:
          'FACEBOOK_REDIRECT_URI is required in production.',
      });
    }
  });
});
