import { afterEach, describe, expect, it, vi } from 'vitest';
import { authApi } from '../../auth/services/authApi.js';
import { tagsApi } from './tagsApi.js';

afterEach(() => vi.restoreAllMocks());

describe('tags API client', () => {
  it('uses the protected tag CRUD endpoints', async () => {
    const request = vi.spyOn(authApi, 'request').mockResolvedValue(null);

    await tagsApi.rename('tag-1', 'Planning');
    await tagsApi.delete('tag-1');

    expect(request).toHaveBeenNthCalledWith(1, '/tags/tag-1', {
      method: 'PATCH',
      body: JSON.stringify({ name: 'Planning' }),
    });
    expect(request).toHaveBeenNthCalledWith(2, '/tags/tag-1', {
      method: 'DELETE',
    });
  });
});
