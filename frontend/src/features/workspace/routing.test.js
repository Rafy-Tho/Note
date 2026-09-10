import { describe, expect, it } from 'vitest';
import { collectionPath, notePath, viewFromPath } from './routing.js';

describe('workspace routing', () => {
  it('maps workspace URLs to collection views', () => {
    expect(viewFromPath('/workspace/notes')).toBe('notes');
    expect(viewFromPath('/workspace/favorites/note-1')).toBe('favorites');
    expect(viewFromPath('/workspace/archive')).toBe('archive');
    expect(viewFromPath('/workspace/tags/tag-1')).toBe('tags');
    expect(viewFromPath('/workspace/search?q=notes')).toBe('search');
    expect(viewFromPath('/workspace/trash')).toBe('trash');
  });

  it('builds collection and note URLs', () => {
    expect(collectionPath('notes')).toBe('/workspace/notes');
    expect(collectionPath('tags', 'tag-1')).toBe('/workspace/tags/tag-1');
    expect(notePath('favorites', 'note-1')).toBe('/workspace/favorites/note-1');
    expect(notePath('tags', 'note-1', 'tag-1')).toBe(
      '/workspace/tags/tag-1/note-1',
    );
  });
});
