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
    sessionCookieName: env.SESSION_COOKIE_NAME ?? 'note_app_session',
    csrfSecret: env.CSRF_SECRET ?? 'development-only-csrf-secret',
    corsOrigin: env.CORS_ORIGIN ?? '',
  };
}
