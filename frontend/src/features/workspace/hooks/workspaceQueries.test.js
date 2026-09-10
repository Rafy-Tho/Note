import { describe, expect, it } from 'vitest';
import {
  flattenNotesPages,
  getNextNotesPageParam,
} from './useWorkspaceQueries.js';

describe('workspace note pagination', () => {
  it('returns the next page until the server total is loaded', () => {
    const first = {
      data: [{ id: 'note-1' }, { id: 'note-2' }],
      pagination: { page: 1, limit: 2, total: 5 },
    };
    const second = {
      data: [{ id: 'note-3' }, { id: 'note-4' }],
      pagination: { page: 2, limit: 2, total: 5 },
    };

    expect(getNextNotesPageParam(first, [first])).toBe(2);
    expect(getNextNotesPageParam(second, [first, second])).toBe(3);
  });

  it('stops when all reported notes are loaded', () => {
    const page = {
      data: [{ id: 'note-1' }, { id: 'note-2' }],
      pagination: { page: 2, limit: 2, total: 2 },
    };

    expect(getNextNotesPageParam(page, [page])).toBeUndefined();
  });

  it('flattens pages in server order', () => {
    expect(
      flattenNotesPages({
        pages: [
          { data: [{ id: 'note-1' }] },
          { data: [{ id: 'note-2' }] },
        ],
      }),
    ).toEqual([{ id: 'note-1' }, { id: 'note-2' }]);
  });
});
