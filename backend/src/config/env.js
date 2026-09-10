const productionEnvironments = new Set(['production', 'test']);

export function getConfig(env = process.env) {
  const nodeEnv = env.NODE_ENV ?? 'development';
  const port = Number(env.PORT ?? 3000);
  const errors = {};

  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    errors.PORT = 'PORT must be an integer between 1 and 65535.';
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

  if (nodeEnv === 'production' && !env.BREVO_API_KEY) {
    errors.BREVO_API_KEY = 'BREVO_API_KEY is required in production.';
  }

  if (nodeEnv === 'production' && !env.BREVO_FROM_EMAIL) {
    errors.BREVO_FROM_EMAIL = 'BREVO_FROM_EMAIL is required in production.';
  }

  if (nodeEnv === 'production' && !env.BREVO_FROM_NAME) {
    errors.BREVO_FROM_NAME = 'BREVO_FROM_NAME is required in production.';
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
    csrfSecret: env.CSRF_SECRET ?? 'development-only-csrf-secret',
    corsOrigin: env.CORS_ORIGIN ?? '',
    brevoApiKey: env.BREVO_API_KEY ?? '',
    brevoFromEmail: env.BREVO_FROM_EMAIL ?? '',
    brevoFromName: env.BREVO_FROM_NAME ?? '',
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
