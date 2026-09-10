import { describe, expect, it } from 'vitest';
import { appendToast, isAllowedLink } from './feedback.js';

describe('workspace feedback helpers', () => {
  it('allows supported link protocols and empty values for link removal', () => {
    expect(isAllowedLink('https://example.com')).toBe(true);
    expect(isAllowedLink('mailto:user@example.com')).toBe(true);
    expect(isAllowedLink('')).toBe(true);
    expect(isAllowedLink('javascript:alert(1)')).toBe(false);
  });

  it('keeps the toast queue bounded to the newest notifications', () => {
    const current = [{ id: 1 }, { id: 2 }, { id: 3 }];
    expect(appendToast(current, { id: 4 })).toEqual([
      { id: 2 },
      { id: 3 },
      { id: 4 },
    ]);
  });
});
