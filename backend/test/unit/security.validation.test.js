import { describe, expect, it } from 'vitest';
import { assertPagination } from '../../src/common/validation/validation.js';
import {
  validateOAuthCallback,
  validatePasswordResetBody,
} from '../../src/modules/auth/auth.validation.js';
import { validateCreateNote } from '../../src/modules/notes/notes.validation.js';

describe('security-sensitive validation', () => {
  it('does not coerce repeated pagination parameters into scalar values', () => {
    expect(() => assertPagination({ page: ['1', '2'], limit: '20' })).toThrow();
  });

  it('bounds OAuth callback values', () => {
    expect(() =>
      validateOAuthCallback({ code: 'x'.repeat(2049), state: 'valid-state' }),
    ).toThrow();
    expect(() =>
      validateOAuthCallback({ code: 'valid-code', state: 'x'.repeat(513) }),
    ).toThrow();
  });

  it('accepts opaque reset tokens and rejects malformed values', () => {
    expect(
      validatePasswordResetBody({
        token: 'valid-reset-token-123456',
        password: 'new-correct-password',
      }).token,
    ).toBe('valid-reset-token-123456');
    expect(() =>
      validatePasswordResetBody({
        token: '<script>alert(1)</script>',
        password: 'new-correct-password',
      }),
    ).toThrow();
  });

  it('rejects unsafe links and deeply nested rich-text documents', () => {
    expect(() =>
      validateCreateNote({
        title: 'Unsafe',
        contentJson: {
          type: 'doc',
          content: [
            {
              type: 'paragraph',
              content: [
                {
                  type: 'text',
                  text: 'click me',
                  marks: [
                    { type: 'link', attrs: { href: 'javascript:alert(1)' } },
                  ],
                },
              ],
            },
          ],
        },
      }),
    ).toThrow();

    let nested = { type: 'text', text: 'too deep' };
    for (let index = 0; index < 110; index += 1) {
      nested = { type: 'paragraph', content: [nested] };
    }
    expect(() =>
      validateCreateNote({
        title: 'Deep',
        contentJson: { type: 'doc', content: [nested] },
      }),
    ).toThrow();
  });
});
