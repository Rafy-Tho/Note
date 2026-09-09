function serializeError(error) {
  return {
    name: error.name,
    code: error.code,
  };
}

export function createLogger({ output = console } = {}) {
  return {
    info(message, metadata = {}) {
      output.info(JSON.stringify({ level: 'info', message, ...metadata }));
    },
    error(message, error, metadata = {}) {
      output.error(
        JSON.stringify({
          level: 'error',
          message,
          error: serializeError(error),
          ...metadata,
        }),
      );
    },
  };
}
