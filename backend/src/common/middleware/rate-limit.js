import rateLimit from 'express-rate-limit';

const rateLimitMessage = {
  error: {
    code: 'RATE_LIMITED',
    message: 'Too many requests. Please try again later.',
  },
};

export function createRateLimiter({
  windowMs,
  limit,
  message = rateLimitMessage,
  store,
} = {}) {
  const options = {
    windowMs,
    limit,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    statusCode: 429,
    message,
  };
  if (store) options.store = store;
  return rateLimit(options);
}

export function createApiRateLimiter(config = {}, rateLimitStores) {
  return createRateLimiter({
    windowMs: config.apiRateLimitWindowMs ?? 15 * 60 * 1000,
    limit: config.apiRateLimitMax ?? 300,
    store: rateLimitStores?.api,
  });
}

export function createAuthRateLimiter(config = {}, rateLimitStores) {
  return createRateLimiter({
    windowMs: config.authRateLimitWindowMs ?? 15 * 60 * 1000,
    limit: config.authRateLimitMax ?? 10,
    store: rateLimitStores?.auth,
    message: {
      error: {
        code: 'RATE_LIMITED',
        message: 'Too many authentication attempts.',
      },
    },
  });
}
