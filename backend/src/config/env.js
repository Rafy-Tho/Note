export function getConfig(env = process.env) {
  return {
    nodeEnv: env.NODE_ENV ?? 'development',
    port: Number(env.PORT ?? 3000),
    databaseUrl: env.DATABASE_URL ?? '',
  };
}
