import { afterEach, describe, expect, it, vi } from 'vitest';
import { authApi } from '../../auth/services/authApi.js';
import { notesApi } from './notesApi.js';

afterEach(() => vi.restoreAllMocks());

describe('notes API client', () => {
  it('keeps collection pagination metadata for infinite lists', async () => {
    const requestCollection = vi
      .spyOn(authApi, 'requestCollection')
      .mockResolvedValue({
        data: [{ id: 'note-1' }],
        pagination: { page: 1, limit: 20, total: 1 },
      });
    const signal = new globalThis.AbortController().signal;

    const result = await notesApi.list({ page: 1, limit: 20 }, { signal });

    expect(result.pagination.total).toBe(1);
    expect(requestCollection).toHaveBeenCalledWith(
      '/notes?page=1&limit=20',
      { signal },
    );
  });
});
