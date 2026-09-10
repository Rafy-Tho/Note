import { describe, expect, it, vi } from 'vitest';
import { authApi } from '../../auth/services/authApi.js';
import { workspaceApi } from './workspaceApi.js';

describe('workspaceApi', () => {
  it('requests sidebar counts with abort options', async () => {
    const counts = {
      notes: 2,
      favorites: 1,
      archive: 0,
      trash: 0,
      notebooks: 1,
      tags: 1,
      notebookCounts: [],
      tagCounts: [],
    };
    vi.spyOn(authApi, 'request').mockResolvedValue(counts);
    const signal = {};

    await expect(workspaceApi.getSidebarCounts({ signal })).resolves.toEqual(
      counts,
    );
    expect(authApi.request).toHaveBeenCalledWith('/workspace/sidebar-counts', {
      signal,
    });
  });
});
