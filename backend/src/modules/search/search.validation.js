import { validationError } from '../../common/errors.js';
import { assertPagination } from '../../common/validation.js';

const SEARCH_QUERY_MAX_LENGTH = 200;

export function validateSearch(query) {
  const pagination = assertPagination(query);
  const value = typeof query.q === 'string' ? query.q.trim() : '';
  const fields = {};

  if (!value) fields.q = 'Must contain search text.';
  if (value.length > SEARCH_QUERY_MAX_LENGTH)
    fields.q = `Must be no longer than ${SEARCH_QUERY_MAX_LENGTH} characters.`;
  if (Object.keys(fields).length > 0) throw validationError(fields);

  return { ...pagination, q: value };
}
