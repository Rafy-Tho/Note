import express from 'express';
import { createLogger } from '../common/utils/logger.js';
import {
  payloadTooLargeError,
  unsupportedMediaTypeError,
  validationError,
} from '../common/errors/errors.js';
import {
  errorHandler,
  notFoundHandler,
} from '../common/errors/errorHandler.js';
import { configureMiddleware } from './middleware.js';
import { configureRoutes } from './routes.js';
import { getConfig } from '../config/env.js';
import { createAuthRepository } from '../modules/auth/auth.repository.js';
import { createAuthService } from '../modules/auth/auth.service.js';
import { createBrevoMailService } from '../modules/auth/mail.service.js';
import { createGoogleProvider } from '../modules/auth/providers/google.provider.js';
import { createFacebookProvider } from '../modules/auth/providers/facebook.provider.js';
import { createTagsRepository } from '../modules/tags/tags.repository.js';
import { createTagsService } from '../modules/tags/tags.service.js';
import { createNotebooksRepository } from '../modules/notebooks/notebooks.repository.js';
import { createNotebooksService } from '../modules/notebooks/notebooks.service.js';
import { createSidebarCountsRepository } from '../modules/workspace/sidebarCounts.repository.js';
import { createSidebarCountsService } from '../modules/workspace/sidebarCounts.service.js';

function rateLimitConfigurationError(fields) {
  const error = new Error('Invalid rate-limit configuration.');
  error.code = 'CONFIGURATION_ERROR';
  error.fields = fields;
  return error;
}

function validateRateLimitRuntime({ config, rateLimitStores, logger }) {
  const storeMode = config.rateLimitStoreMode ?? 'memory';
  const instanceCount = config.backendInstanceCount ?? 1;

  if (!['memory', 'shared'].includes(storeMode)) {
    throw rateLimitConfigurationError({
      RATE_LIMIT_STORE: 'RATE_LIMIT_STORE must be memory or shared.',
    });
  }
  if (!Number.isInteger(instanceCount) || instanceCount < 1) {
    throw rateLimitConfigurationError({
      BACKEND_INSTANCE_COUNT:
        'BACKEND_INSTANCE_COUNT must be a positive integer.',
    });
  }
  if (
    storeMode === 'shared' &&
    (!rateLimitStores?.api || !rateLimitStores?.auth)
  ) {
    throw rateLimitConfigurationError({
      RATE_LIMIT_STORE:
        'Shared rate-limit mode requires separate api and auth store adapters.',
    });
  }
  if (
    config.nodeEnv === 'production' &&
    instanceCount > 1 &&
    storeMode !== 'shared'
  ) {
    throw rateLimitConfigurationError({
      RATE_LIMIT_STORE:
        'RATE_LIMIT_STORE=shared is required when BACKEND_INSTANCE_COUNT is greater than 1 in production.',
    });
  }
  if (
    config.nodeEnv === 'production' &&
    instanceCount === 1 &&
    storeMode === 'memory' &&
    typeof logger.warn === 'function'
  ) {
    logger.warn('Using process-local rate-limit storage.', {
      backendInstanceCount: instanceCount,
    });
  }
}

export function createApp({
  databaseCheck,
  logger = createLogger(),
  configureRoutes: extendRoutes = () => {},
  config = getConfig(),
  authService = createAuthService({
    repository: createAuthRepository(),
    mailService: createBrevoMailService({
      apiKey: config.brevoApiKey,
      fromEmail: config.brevoFromEmail,
      fromName: config.brevoFromName,
      appUrl: config.appUrl,
    }),
    authCodeSecret: config.authCodeSecret,
    googleProvider: createGoogleProvider(config),
    facebookProvider: createFacebookProvider(config),
  }),
  notesService,
  tagsService,
  searchService,
  notebooksService,
  sidebarCountsService,
  rateLimitStores,
} = {}) {
  validateRateLimitRuntime({ config, rateLimitStores, logger });
  const app = express();
  const resolvedTagsService =
    tagsService ?? createTagsService({ repository: createTagsRepository() });
  const resolvedNotebooksService =
    notebooksService ??
    createNotebooksService({ repository: createNotebooksRepository() });
  const resolvedSidebarCountsService =
    sidebarCountsService ??
    createSidebarCountsService({
      repository: createSidebarCountsRepository(),
    });

  app.disable('x-powered-by');
  configureMiddleware(app, { logger, config, rateLimitStores });
  configureRoutes(app, {
    databaseCheck,
    authService,
    config,
    notesService,
    tagsService: resolvedTagsService,
    searchService,
    notebooksService: resolvedNotebooksService,
    sidebarCountsService: resolvedSidebarCountsService,
    rateLimitStores,
  });
  extendRoutes(app);

  app.use(notFoundHandler);
  app.use((error, _request, _response, next) => {
    if (error?.type === 'entity.too.large') {
      next(payloadTooLargeError());
      return;
    }
    if (error?.type === 'encoding.unsupported') {
      next(unsupportedMediaTypeError());
      return;
    }
    if (error instanceof SyntaxError && 'body' in error) {
      next(validationError({ body: 'Malformed JSON.' }));
      return;
    }
    next(error);
  });
  app.use(errorHandler);

  return app;
}
