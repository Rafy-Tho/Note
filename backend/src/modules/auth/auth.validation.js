import { validationError } from '../../common/errors.js';

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function normalizeEmail(value) {
  if (typeof value !== 'string') return null;
  const email = value.trim().toLowerCase();
  return emailPattern.test(email) && email.length <= 320 ? email : null;
}

export function validateCredentials(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw validationError({ body: 'Must be an object.' });
  }

  const email = normalizeEmail(body.email);
  const fields = {};
  if (!email) fields.email = 'Must be a valid email address.';
  if (
    typeof body.password !== 'string' ||
    body.password.length < 12 ||
    body.password.length > 128
  ) {
    fields.password = 'Must be between 12 and 128 characters.';
  }
  if (Object.keys(fields).length > 0) throw validationError(fields);

  return { email, password: body.password };
}
