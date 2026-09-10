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

export function validateEmailBody(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw validationError({ body: 'Must be an object.' });
  }

  const email = normalizeEmail(body.email);
  if (!email)
    throw validationError({ email: 'Must be a valid email address.' });
  return email;
}

export function validateVerificationTokenBody(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw validationError({ body: 'Must be an object.' });
  }
  if (typeof body.token !== 'string' || body.token.length < 20) {
    throw validationError({ token: 'Must be a valid verification token.' });
  }
  return body.token;
}

export function validatePasswordResetBody(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw validationError({ body: 'Must be an object.' });
  }

  const fields = {};
  if (typeof body.token !== 'string' || body.token.length < 20) {
    fields.token = 'Must be a valid password reset token.';
  }
  if (
    typeof body.password !== 'string' ||
    body.password.length < 12 ||
    body.password.length > 128
  ) {
    fields.password = 'Must be between 12 and 128 characters.';
  }
  if (Object.keys(fields).length > 0) throw validationError(fields);
  return { token: body.token, password: body.password };
}
