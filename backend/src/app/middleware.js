import express from 'express';
import { URL } from 'node:url';
import compression from 'compression';
import cors from 'cors';
import helmet from 'helmet';
import hpp from 'hpp';
import { AppError } from '../common/errors/errors.js';
import { requestContext } from '../common/middleware/request-context.js';
import { requestLogging } from '../common/middleware/logging.js';
import { createApiRateLimiter } from '../common/middleware/rate-limit.js';

function getCorsOrigins(config = {}) {
  if (Array.isArray(config.corsOrigins)) return config.corsOrigins;
  return String(config.corsOrigin ?? '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}

function createSameOriginMiddleware(config = {}) {
  const allowedOrigins = getCorsOrigins(config);
  const requireSameOriginHeaders = config.requireSameOriginHeaders ?? true;
  const unsafeMethods = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

  return (request, _response, next) => {
    if (!unsafeMethods.has(request.method)) {
      next();
      return;
    }

    const origin = request.get('origin');
    const referer = request.get('referer');
    let requestOrigin = origin;

    if (!requestOrigin && referer) {
      try {
        requestOrigin = new URL(referer).origin;
      } catch {
        next(
          new AppError(
            403,
            'ORIGIN_INVALID',
            'The request origin could not be verified.',
          ),
        );
        return;
      }
    }

    if (!requestOrigin && requireSameOriginHeaders) {
      next(
        new AppError(
          403,
          'ORIGIN_INVALID',
          'The request origin could not be verified.',
        ),
      );
      return;
    }

    if (requestOrigin && !allowedOrigins.includes(requestOrigin)) {
      next(
        new AppError(
          403,
          'ORIGIN_INVALID',
          'The request origin could not be verified.',
        ),
      );
      return;
    }

    next();
  };
}

function rejectParameterPollution(request, _response, next) {
  const hasNestedQueryValue = Object.values(request.query).some((value) => {
    if (Array.isArray(value)) {
      return value.some((item) => item !== null && typeof item === 'object');
    }
    return value !== null && typeof value === 'object';
  });
  if (hasNestedQueryValue) {
    next(
      new AppError(
        400,
        'PARAMETER_POLLUTION',
        'Nested query parameters are not allowed.',
      ),
    );
    return;
  }
  next();
}

export function configureMiddleware(
  app,
  { logger, config = {}, rateLimitStores } = {},
) {
  // Express accepts boolean trust modes or a numeric trusted-proxy hop count.
  app.set('trust proxy', config.trustProxy ?? false);
  app.set('query parser', 'extended');
  app.use(
    helmet(
      config.nodeEnv === 'production'
        ? {}
        : {
            hsts: false,
          },
    ),
  );
  app.use(
    cors({
      origin(origin, callback) {
        const allowedOrigins = getCorsOrigins(config);
        callback(null, Boolean(origin && allowedOrigins.includes(origin)));
      },
      credentials: true,
      methods: ['GET', 'HEAD', 'OPTIONS', 'POST', 'PUT', 'PATCH', 'DELETE'],
      allowedHeaders: ['Content-Type', 'X-CSRF-Token', 'X-Request-ID'],
      exposedHeaders: [
        'X-Request-ID',
        'RateLimit-Limit',
        'RateLimit-Remaining',
        'RateLimit-Reset',
      ],
    }),
  );
  app.use(requestContext);
  app.use(requestLogging(logger));
  app.use(hpp());
  app.use(rejectParameterPollution);
  app.use(createApiRateLimiter(config, rateLimitStores));
  app.use(createSameOriginMiddleware(config));
  app.use(express.json({ limit: config.requestBodyLimit ?? '1mb' }));
  app.use(
    compression({
      threshold: '1kb',
      filter(request, response) {
        if (request.path.startsWith('/api/v1/auth')) return false;
        return compression.filter(request, response);
      },
    }),
  );
}
