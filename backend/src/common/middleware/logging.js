export function requestLogging(logger) {
  return (request, response, next) => {
    request.logger = logger;
    const startedAt = Date.now();
    const path = (request.originalUrl ?? request.url).split('?')[0];

    response.on('finish', () => {
      logger.info('HTTP request', {
        requestId: request.requestId,
        method: request.method,
        path,
        status: response.statusCode,
        durationMs: Date.now() - startedAt,
      });
    });

    next();
  };
}
