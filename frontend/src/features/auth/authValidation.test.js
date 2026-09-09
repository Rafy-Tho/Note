import { describe, expect, it } from 'vitest';
import { validateCredentials } from './authValidation.js';

describe('validateCredentials', () => {
  it('normalizes valid email input and accepts a valid password', () => {
    expect(
      validateCredentials({
        email: ' User@Example.COM ',
        password: 'correct-password',
      }),
    ).toEqual({
      fields: {},
      credentials: { email: 'user@example.com', password: 'correct-password' },
    });
  });

  it('returns field errors for invalid credentials', () => {
    expect(
      validateCredentials({ email: 'not-an-email', password: 'short' }).fields,
    ).toEqual({
      email: 'Enter a valid email address.',
      password: 'Use a password between 12 and 128 characters.',
    });
  });
});
