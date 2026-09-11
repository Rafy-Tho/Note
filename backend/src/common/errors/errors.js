export class AppError extends Error {
  constructor(status, code, message, fields) {
    super(message);
    this.name = 'AppError';
    this.status = status;
    this.code = code;
    this.fields = fields;
  }
}

export function validationError(fields) {
  return new AppError(
    400,
    'VALIDATION_ERROR',
    'The request is invalid.',
    fields,
  );
}

export function payloadTooLargeError() {
  return new AppError(
    413,
    'PAYLOAD_TOO_LARGE',
    'The request body is too large.',
  );
}

export function unsupportedMediaTypeError() {
  return new AppError(
    415,
    'UNSUPPORTED_MEDIA_TYPE',
    'The request encoding is not supported.',
  );
}

export function notFoundError() {
  return new AppError(
    404,
    'NOT_FOUND',
    'The requested resource was not found.',
  );
}

export function authenticationRequiredError() {
  return new AppError(
    401,
    'AUTHENTICATION_REQUIRED',
    'Authentication is required.',
  );
}

export function normalizeError(error) {
  if (error instanceof AppError) {
    return error;
  }

  return new AppError(
    500,
    'INTERNAL_SERVER_ERROR',
    'An unexpected error occurred.',
  );
}
