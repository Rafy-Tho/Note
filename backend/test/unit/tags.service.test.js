import { describe, expect, it, vi } from 'vitest';
import { createTagsService } from '../../src/modules/tags/tags.service.js';

function transaction(work) {
  return work({});
}

describe('tags service', () => {
  it('updates the searchable projection when assigning a tag', async () => {
    const updateSearchProjection = vi.fn();
    const repository = {
      findNote: vi.fn(async () => ({
        id: 'note-1',
        title: 'Planning',
        content_json: {
          type: 'doc',
          content: [
            { type: 'paragraph', content: [{ type: 'text', text: 'Roadmap' }] },
          ],
        },
        state: 'active',
      })),
      findTag: vi.fn(async () => ({ id: 'tag-1', name: 'Work' })),
      assign: vi.fn(),
      listNoteTags: vi.fn(async () => [{ id: 'tag-1', name: 'Work' }]),
      updateSearchProjection,
    };
    const service = createTagsService({ repository, transaction });

    await service.assign('user-1', 'note-1', 'tag-1');

    expect(updateSearchProjection).toHaveBeenCalledWith(
      expect.anything(),
      'user-1',
      'note-1',
      {
        searchableText: 'Planning Roadmap Work',
        searchTitle: 'Planning',
        searchContent: 'Roadmap',
        searchTags: 'Work',
      },
    );
  });

  it('rejects tag assignment to a trashed note', async () => {
    const repository = {
      findNote: vi.fn(async () => ({ id: 'note-1', state: 'trashed' })),
    };
    const service = createTagsService({ repository, transaction });

    await expect(
      service.assign('user-1', 'note-1', 'tag-1'),
    ).rejects.toMatchObject({
      code: 'INVALID_STATE_TRANSITION',
      status: 409,
    });
  });
});
