import { validationError } from '../../common/errors/errors.js';

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

export function validateOAuthCallback(query) {
  const fields = {};
  const code = query?.code;
  const state = query?.state;

  if (typeof code !== 'string' || code.length < 1 || code.length > 2048) {
    fields.code = 'Must be a valid provider authorization code.';
  }
  if (typeof state !== 'string' || state.length < 1 || state.length > 512) {
    fields.state = 'Must be a valid provider state value.';
  }
  if (Object.keys(fields).length > 0) throw validationError(fields);

  return { code, state };
}

export function validateVerificationCodeBody(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw validationError({ body: 'Must be an object.' });
  }
  const code =
    typeof body.code === 'string' ? body.code.replace(/\s/g, '') : '';
  if (!/^\d{6}$/.test(code)) {
    throw validationError({ code: 'Must be a six-digit verification code.' });
  }
  return code;
}

export function validatePasswordResetBody(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw validationError({ body: 'Must be an object.' });
  }

  const fields = {};
  if (
    typeof body.token !== 'string' ||
    body.token.length < 20 ||
    body.token.length > 512 ||
    !/^[A-Za-z0-9_-]+$/.test(body.token)
  ) {
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
