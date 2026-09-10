export function requestLogging(logger) {
  return (request, response, next) => {
    request.logger = logger;
    const startedAt = Date.now();

    response.on('finish', () => {
      logger.info('HTTP request', {
        requestId: request.requestId,
        method: request.method,
        path: request.originalUrl,
        status: response.statusCode,
        durationMs: Date.now() - startedAt,
      });
    });

    next();
  };
}
