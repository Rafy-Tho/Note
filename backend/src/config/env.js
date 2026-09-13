import { URL } from 'node:url';

const productionEnvironments = new Set(['production', 'test']);

function parseOrigins(value) {
  return String(value ?? '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}

function isValidOrigin(origin) {
  try {
    const parsed = new URL(origin);
    return (
      (parsed.protocol === 'http:' || parsed.protocol === 'https:') &&
      parsed.origin === origin &&
      !parsed.username &&
      !parsed.password
    );
  } catch {
    return false;
  }
}

function parseInteger(value, fallback, minimum = 1) {
  const parsed = Number(value ?? fallback);
  return Number.isInteger(parsed) && parsed >= minimum ? parsed : null;
}

function parseTrustProxy(value) {
  if (value === 'true') return true;
  if (value === 'false') return false;
  if (!/^(0|[1-9][0-9]*)$/.test(value)) return null;
  return Number(value);
}

export function getConfig(env = process.env) {
  const nodeEnv = env.NODE_ENV ?? 'development';
  const port = Number(env.PORT ?? 3000);
  const errors = {};
  const configuredCorsOrigin = String(env.CORS_ORIGIN ?? '').trim();
  const corsOrigin =
    nodeEnv === 'development' && !configuredCorsOrigin
      ? 'http://localhost:5173'
      : configuredCorsOrigin;
  const corsOrigins = parseOrigins(corsOrigin);
  const cookieSecureValue = env.COOKIE_SECURE;
  const cookieSameSite = (env.COOKIE_SAME_SITE ?? 'lax').toLowerCase();
  const allowCrossSiteCookiesValue = env.ALLOW_CROSS_SITE_COOKIES;
  let allowCrossSiteCookies = false;
  const requireSameOriginHeadersValue = env.REQUIRE_SAME_ORIGIN_HEADERS;
  let requireSameOriginHeaders = nodeEnv !== 'development';
  const apiRateLimitWindowMs = parseInteger(
    env.API_RATE_LIMIT_WINDOW_MS,
    15 * 60 * 1000,
  );
  const apiRateLimitMax = parseInteger(env.API_RATE_LIMIT_MAX, 300);
  const authRateLimitWindowMs = parseInteger(
    env.AUTH_RATE_LIMIT_WINDOW_MS,
    15 * 60 * 1000,
  );
  const authRateLimitMax = parseInteger(env.AUTH_RATE_LIMIT_MAX, 10);
  const rateLimitStoreMode = env.RATE_LIMIT_STORE ?? 'memory';
  const backendInstanceCount = parseInteger(env.BACKEND_INSTANCE_COUNT, 1);
  const smtpPort = parseInteger(env.SMTP_PORT, 465);
  const smtpSecureValue = env.SMTP_SECURE;
  let smtpSecure = smtpPort === 465;
  const trustProxyValue = env.TRUST_PROXY;
  let trustProxy = false;

  if (corsOrigins.some((origin) => origin === '*' || !isValidOrigin(origin))) {
    errors.CORS_ORIGIN =
      'CORS_ORIGIN must contain one or more exact HTTP(S) origins.';
  }

  if (nodeEnv === 'production' && corsOrigins.length === 0) {
    errors.CORS_ORIGIN = 'CORS_ORIGIN is required in production.';
  }

  if (
    cookieSecureValue !== undefined &&
    !['true', 'false'].includes(cookieSecureValue)
  ) {
    errors.COOKIE_SECURE = 'COOKIE_SECURE must be true or false.';
  }

  if (!['lax', 'strict', 'none'].includes(cookieSameSite)) {
    errors.COOKIE_SAME_SITE = 'COOKIE_SAME_SITE must be lax, strict, or none.';
  }

  if (allowCrossSiteCookiesValue !== undefined) {
    if (!['true', 'false'].includes(allowCrossSiteCookiesValue)) {
      errors.ALLOW_CROSS_SITE_COOKIES =
        'ALLOW_CROSS_SITE_COOKIES must be true or false.';
    } else {
      allowCrossSiteCookies = allowCrossSiteCookiesValue === 'true';
    }
  }

  const cookieSecure =
    cookieSecureValue === undefined
      ? nodeEnv === 'production'
      : cookieSecureValue === 'true';
  if (cookieSameSite === 'none' && !cookieSecure) {
    errors.COOKIE_SAME_SITE =
      'COOKIE_SAME_SITE=none requires COOKIE_SECURE=true.';
  }

  if (requireSameOriginHeadersValue !== undefined) {
    if (!['true', 'false'].includes(requireSameOriginHeadersValue)) {
      errors.REQUIRE_SAME_ORIGIN_HEADERS =
        'REQUIRE_SAME_ORIGIN_HEADERS must be true or false.';
    } else {
      requireSameOriginHeaders = requireSameOriginHeadersValue === 'true';
    }
  }

  if (cookieSameSite === 'none' && !allowCrossSiteCookies) {
    errors.COOKIE_SAME_SITE =
      'COOKIE_SAME_SITE=none requires ALLOW_CROSS_SITE_COOKIES=true.';
  }
  if (cookieSameSite === 'none' && allowCrossSiteCookies) {
    if (corsOrigins.length === 0) {
      errors.CORS_ORIGIN =
        'CORS_ORIGIN is required when cross-site cookies are enabled.';
    }
    if (!requireSameOriginHeaders) {
      errors.REQUIRE_SAME_ORIGIN_HEADERS =
        'REQUIRE_SAME_ORIGIN_HEADERS=true is required when cross-site cookies are enabled.';
    }
  }

  if (apiRateLimitWindowMs === null) {
    errors.API_RATE_LIMIT_WINDOW_MS =
      'API_RATE_LIMIT_WINDOW_MS must be a positive integer.';
  }
  if (apiRateLimitMax === null) {
    errors.API_RATE_LIMIT_MAX =
      'API_RATE_LIMIT_MAX must be a positive integer.';
  }
  if (authRateLimitWindowMs === null) {
    errors.AUTH_RATE_LIMIT_WINDOW_MS =
      'AUTH_RATE_LIMIT_WINDOW_MS must be a positive integer.';
  }
  if (authRateLimitMax === null) {
    errors.AUTH_RATE_LIMIT_MAX =
      'AUTH_RATE_LIMIT_MAX must be a positive integer.';
  }

  if (!['memory', 'shared'].includes(rateLimitStoreMode)) {
    errors.RATE_LIMIT_STORE = 'RATE_LIMIT_STORE must be memory or shared.';
  }
  if (backendInstanceCount === null) {
    errors.BACKEND_INSTANCE_COUNT =
      'BACKEND_INSTANCE_COUNT must be a positive integer.';
  }
  if (
    nodeEnv === 'production' &&
    backendInstanceCount !== null &&
    backendInstanceCount > 1 &&
    rateLimitStoreMode === 'memory'
  ) {
    errors.RATE_LIMIT_STORE =
      'RATE_LIMIT_STORE=shared is required when BACKEND_INSTANCE_COUNT is greater than 1 in production.';
  }

  if (trustProxyValue !== undefined) {
    const parsedTrustProxy = parseTrustProxy(trustProxyValue);
    if (parsedTrustProxy === null) {
      errors.TRUST_PROXY =
        'TRUST_PROXY must be true, false, or a non-negative integer.';
    } else {
      trustProxy = parsedTrustProxy;
    }
  }

  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    errors.PORT = 'PORT must be an integer between 1 and 65535.';
  }

  if (smtpPort === null || smtpPort > 65535) {
    errors.SMTP_PORT = 'SMTP_PORT must be an integer between 1 and 65535.';
  }

  if (smtpSecureValue !== undefined) {
    if (!['true', 'false'].includes(smtpSecureValue)) {
      errors.SMTP_SECURE = 'SMTP_SECURE must be true or false.';
    } else {
      smtpSecure = smtpSecureValue === 'true';
    }
  }

  if (!env.DATABASE_URL) {
    errors.DATABASE_URL = 'DATABASE_URL is required.';
  }

  if (productionEnvironments.has(nodeEnv) && !env.SESSION_SECRET) {
    errors.SESSION_SECRET = 'SESSION_SECRET is required outside development.';
  }

  if (productionEnvironments.has(nodeEnv) && !env.CSRF_SECRET) {
    errors.CSRF_SECRET = 'CSRF_SECRET is required outside development.';
  }

  if (nodeEnv === 'production' && !env.SMTP_HOST) {
    errors.SMTP_HOST = 'SMTP_HOST is required in production.';
  }

  if (nodeEnv === 'production' && !env.SMTP_USER) {
    errors.SMTP_USER = 'SMTP_USER is required in production.';
  }

  if (nodeEnv === 'production' && !env.SMTP_PASSWORD) {
    errors.SMTP_PASSWORD = 'SMTP_PASSWORD is required in production.';
  }

  if (nodeEnv === 'production' && !env.MAIL_FROM) {
    errors.MAIL_FROM = 'MAIL_FROM is required in production.';
  }

  if (nodeEnv === 'production' && !env.MAIL_FROM_NAME) {
    errors.MAIL_FROM_NAME = 'MAIL_FROM_NAME is required in production.';
  }

  if (nodeEnv === 'production' && !env.APP_URL) {
    errors.APP_URL = 'APP_URL is required in production.';
  }

  if (nodeEnv === 'production' && !env.GOOGLE_CLIENT_ID) {
    errors.GOOGLE_CLIENT_ID = 'GOOGLE_CLIENT_ID is required in production.';
  }

  if (nodeEnv === 'production' && !env.GOOGLE_CLIENT_SECRET) {
    errors.GOOGLE_CLIENT_SECRET =
      'GOOGLE_CLIENT_SECRET is required in production.';
  }

  if (nodeEnv === 'production' && !env.GOOGLE_REDIRECT_URI) {
    errors.GOOGLE_REDIRECT_URI =
      'GOOGLE_REDIRECT_URI is required in production.';
  }

  if (nodeEnv === 'production' && !env.FACEBOOK_CLIENT_ID) {
    errors.FACEBOOK_CLIENT_ID = 'FACEBOOK_CLIENT_ID is required in production.';
  }

  if (nodeEnv === 'production' && !env.FACEBOOK_CLIENT_SECRET) {
    errors.FACEBOOK_CLIENT_SECRET =
      'FACEBOOK_CLIENT_SECRET is required in production.';
  }

  if (nodeEnv === 'production' && !env.FACEBOOK_REDIRECT_URI) {
    errors.FACEBOOK_REDIRECT_URI =
      'FACEBOOK_REDIRECT_URI is required in production.';
  }

  if (Object.keys(errors).length > 0) {
    const error = new Error('Invalid application configuration.');
    error.code = 'CONFIGURATION_ERROR';
    error.fields = errors;
    throw error;
  }

  return {
    nodeEnv,
    port,
    databaseUrl: env.DATABASE_URL,
    sessionSecret: env.SESSION_SECRET ?? 'development-only-session-secret',
    authCodeSecret:
      env.AUTH_CODE_SECRET ??
      env.SESSION_SECRET ??
      'development-only-auth-code-secret',
    sessionCookieName: env.SESSION_COOKIE_NAME ?? 'note_app_session',
    cookieSecure,
    cookieSameSite,
    allowCrossSiteCookies,
    requireSameOriginHeaders,
    csrfSecret: env.CSRF_SECRET ?? 'development-only-csrf-secret',
    corsOrigin,
    corsOrigins,
    requestBodyLimit: env.REQUEST_BODY_LIMIT ?? '1mb',
    apiRateLimitWindowMs,
    apiRateLimitMax,
    authRateLimitWindowMs,
    authRateLimitMax,
    rateLimitStoreMode,
    backendInstanceCount,
    trustProxy,
    smtpHost: env.SMTP_HOST ?? '',
    smtpPort: smtpPort ?? 465,
    smtpSecure,
    smtpUser: env.SMTP_USER ?? '',
    smtpPassword: env.SMTP_PASSWORD ?? '',
    mailFrom: env.MAIL_FROM ?? '',
    mailFromName: env.MAIL_FROM_NAME ?? '',
    appUrl: env.APP_URL ?? 'http://localhost:5173',
    googleClientId: env.GOOGLE_CLIENT_ID ?? '',
    googleClientSecret: env.GOOGLE_CLIENT_SECRET ?? '',
    googleRedirectUri: env.GOOGLE_REDIRECT_URI ?? '',
    facebookClientId: env.FACEBOOK_CLIENT_ID ?? '',
    facebookClientSecret: env.FACEBOOK_CLIENT_SECRET ?? '',
    facebookRedirectUri: env.FACEBOOK_REDIRECT_URI ?? '',
    facebookGraphVersion: env.FACEBOOK_GRAPH_VERSION ?? 'v20.0',
  };
}
