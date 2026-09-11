import { validationError } from '../errors/errors.js';

export function assertObject(value, field = 'body') {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw validationError({ [field]: 'Must be an object.' });
  }
}

export function assertUuid(value, field) {
  if (
    typeof value !== 'string' ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      value,
    )
  ) {
    throw validationError({ [field]: 'Must be a valid UUID.' });
  }
}

function parseScalarNumber(value, fallback) {
  if (value === undefined) return fallback;
  if (typeof value !== 'string' && typeof value !== 'number') {
    return Number.NaN;
  }
  return Number(value);
}

export function assertPagination(query) {
  const page = parseScalarNumber(query.page, 1);
  const limit = parseScalarNumber(query.limit, 20);
  const fields = {};

  if (!Number.isInteger(page) || page < 1)
    fields.page = 'Must be a positive integer.';
  if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
    fields.limit = 'Must be an integer between 1 and 100.';
  }
  if (Object.keys(fields).length > 0) throw validationError(fields);

  return { page, limit };
}
