import { describe, expect, it, vi } from 'vitest';
import { createNotesRepository } from '../../src/modules/notes/notes.repository.js';

describe('notes repository list projections', () => {
  it('omits the rich-text document and returns a bounded preview', async () => {
    const database = {
      query: vi
        .fn()
        .mockResolvedValueOnce({ rows: [{ total: 1 }] })
        .mockResolvedValueOnce({
          rows: [
            {
              id: 'note-1',
              title: 'A note',
              state: 'active',
              tags: [],
              preview: 'Preview text',
            },
          ],
        }),
    };
    const repository = createNotesRepository(database);

    const result = await repository.list('user-1', {
      state: 'active',
      favorite: null,
      page: 1,
      limit: 20,
    });

    expect(result.notes[0]).toMatchObject({
      id: 'note-1',
      preview: 'Preview text',
    });
    expect(result.notes[0]).not.toHaveProperty('contentJson');
    expect(database.query.mock.calls[1][0]).not.toContain('content_json');
  });
});
