import { describe, expect, it, vi } from 'vitest';
import { createSidebarCountsRepository } from '../../src/modules/workspace/sidebarCounts.repository.js';

describe('sidebar counts repository', () => {
  it('returns top-level and grouped counts using the authenticated user', async () => {
    const database = {
      query: vi
        .fn()
        .mockResolvedValueOnce({
          rows: [
            {
              notes: 2,
              favorites: 1,
              archive: 1,
              trash: 0,
              notebooks: 4,
              tags: 3,
            },
          ],
        })
        .mockResolvedValueOnce({ rows: [{ id: 'notebook-1', count: 2 }] })
        .mockResolvedValueOnce({ rows: [{ id: 'tag-1', count: 1 }] }),
    };
    const repository = createSidebarCountsRepository(database);

    await expect(repository.get('user-1')).resolves.toEqual({
      notes: 2,
      favorites: 1,
      archive: 1,
      trash: 0,
      notebooks: 4,
      tags: 3,
      notebookCounts: [{ id: 'notebook-1', count: 2 }],
      tagCounts: [{ id: 'tag-1', count: 1 }],
    });

    expect(database.query).toHaveBeenCalledTimes(3);
    expect(database.query.mock.calls[0][1]).toEqual([
      'user-1',
      'user-1',
      'user-1',
      'user-1',
    ]);
    expect(database.query.mock.calls[1][1]).toEqual(['user-1']);
    expect(database.query.mock.calls[2][1]).toEqual(['user-1']);
  });
});
