import { createHash, createHmac, randomBytes } from 'node:crypto';

export function createOpaqueToken(bytes = 32) {
  return randomBytes(bytes).toString('base64url');
}

export function hashOpaqueToken(token) {
  return createHash('sha256').update(token).digest('hex');
}

export function hashVerificationCode(code, secret) {
  return createHmac('sha256', secret).update(code).digest('hex');
}
