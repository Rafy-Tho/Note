import { describe, expect, it } from 'vitest';
import { getConfig } from '../../src/config/env.js';

const validEnvironment = {
  NODE_ENV: 'test',
  PORT: '3000',
  DATABASE_URL: 'mysql://localhost/note_app',
  SESSION_SECRET: 'session-secret',
  CSRF_SECRET: 'csrf-secret',
  CORS_ORIGIN: '',
};

describe('getConfig', () => {
  it('returns normalized application configuration', () => {
    expect(getConfig(validEnvironment)).toEqual({
      nodeEnv: 'test',
      port: 3000,
      databaseUrl: validEnvironment.DATABASE_URL,
      sessionSecret: 'session-secret',
      authCodeSecret: 'session-secret',
      sessionCookieName: 'note_app_session',
      cookieSecure: false,
      cookieSameSite: 'lax',
      allowCrossSiteCookies: false,
      requireSameOriginHeaders: true,
      csrfSecret: 'csrf-secret',
      corsOrigin: '',
      corsOrigins: [],
      requestBodyLimit: '1mb',
      apiRateLimitWindowMs: 900000,
      apiRateLimitMax: 300,
      authRateLimitWindowMs: 900000,
      authRateLimitMax: 10,
      rateLimitStoreMode: 'memory',
      backendInstanceCount: 1,
      trustProxy: false,
      smtpHost: '',
      smtpPort: 465,
      smtpSecure: true,
      smtpUser: '',
      smtpPassword: '',
      mailFrom: '',
      mailFromName: '',
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

  it('defaults development CORS to the local frontend when empty', () => {
    const config = getConfig({
      ...validEnvironment,
      NODE_ENV: 'development',
      CORS_ORIGIN: '',
    });

    expect(config.corsOrigin).toBe('http://localhost:5173');
    expect(config.corsOrigins).toEqual(['http://localhost:5173']);
    expect(config.requireSameOriginHeaders).toBe(false);
  });

  it('preserves supported trust proxy modes', () => {
    expect(
      getConfig({ ...validEnvironment, TRUST_PROXY: 'false' }).trustProxy,
    ).toBe(false);
    expect(
      getConfig({ ...validEnvironment, TRUST_PROXY: 'true' }).trustProxy,
    ).toBe(true);
    expect(
      getConfig({ ...validEnvironment, TRUST_PROXY: '2' }).trustProxy,
    ).toBe(2);
  });

  it('rejects malformed trust proxy values', () => {
    expect(() =>
      getConfig({ ...validEnvironment, TRUST_PROXY: '1.5' }),
    ).toThrow('Invalid application configuration.');

    try {
      getConfig({ ...validEnvironment, TRUST_PROXY: '' });
    } catch (error) {
      expect(error.fields.TRUST_PROXY).toBe(
        'TRUST_PROXY must be true, false, or a non-negative integer.',
      );
    }
  });

  it('normalizes rate-limit store mode and instance count', () => {
    expect(
      getConfig({
        ...validEnvironment,
        RATE_LIMIT_STORE: 'shared',
        BACKEND_INSTANCE_COUNT: '2',
      }),
    ).toMatchObject({
      rateLimitStoreMode: 'shared',
      backendInstanceCount: 2,
    });
  });

  it('rejects process-local rate limiting for multiple production instances', () => {
    const environment = {
      NODE_ENV: 'production',
      BACKEND_INSTANCE_COUNT: '2',
      RATE_LIMIT_STORE: 'memory',
    };
    expect(() => getConfig(environment)).toThrow(
      'Invalid application configuration.',
    );

    try {
      getConfig(environment);
    } catch (error) {
      expect(error.fields.RATE_LIMIT_STORE).toBe(
        'RATE_LIMIT_STORE=shared is required when BACKEND_INSTANCE_COUNT is greater than 1 in production.',
      );
    }
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
        CORS_ORIGIN: 'CORS_ORIGIN is required in production.',
        SMTP_HOST: 'SMTP_HOST is required in production.',
        SMTP_USER: 'SMTP_USER is required in production.',
        SMTP_PASSWORD: 'SMTP_PASSWORD is required in production.',
        MAIL_FROM: 'MAIL_FROM is required in production.',
        MAIL_FROM_NAME: 'MAIL_FROM_NAME is required in production.',
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

  it('rejects SameSite=None without explicit cross-site cookie mode', () => {
    expect(() =>
      getConfig({
        ...validEnvironment,
        CORS_ORIGIN: 'http://frontend.test',
        COOKIE_SECURE: 'true',
        COOKIE_SAME_SITE: 'none',
      }),
    ).toThrow('Invalid application configuration.');

    try {
      getConfig({
        ...validEnvironment,
        CORS_ORIGIN: 'http://frontend.test',
        COOKIE_SECURE: 'true',
        COOKIE_SAME_SITE: 'none',
      });
    } catch (error) {
      expect(error.fields.COOKIE_SAME_SITE).toBe(
        'COOKIE_SAME_SITE=none requires ALLOW_CROSS_SITE_COOKIES=true.',
      );
    }
  });

  it('requires strict origin checks and configured origins in cross-site mode', () => {
    expect(() =>
      getConfig({
        ...validEnvironment,
        COOKIE_SECURE: 'true',
        COOKIE_SAME_SITE: 'none',
        ALLOW_CROSS_SITE_COOKIES: 'true',
        REQUIRE_SAME_ORIGIN_HEADERS: 'false',
      }),
    ).toThrow('Invalid application configuration.');

    expect(
      getConfig({
        ...validEnvironment,
        CORS_ORIGIN: 'http://frontend.test',
        COOKIE_SECURE: 'true',
        COOKIE_SAME_SITE: 'none',
        ALLOW_CROSS_SITE_COOKIES: 'true',
        REQUIRE_SAME_ORIGIN_HEADERS: 'true',
      }),
    ).toMatchObject({
      cookieSameSite: 'none',
      cookieSecure: true,
      allowCrossSiteCookies: true,
      requireSameOriginHeaders: true,
      corsOrigins: ['http://frontend.test'],
    });
  });
});
