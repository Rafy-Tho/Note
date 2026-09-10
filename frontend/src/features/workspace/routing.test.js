import { describe, expect, it } from 'vitest';
import {
  collectionPath,
  mobilePaneFromNoteId,
  notePath,
  searchNotePath,
  viewFromPath,
} from './routing.js';

describe('workspace routing', () => {
  it('maps workspace URLs to collection views', () => {
    expect(viewFromPath('/workspace/notes')).toBe('notes');
    expect(viewFromPath('/workspace/favorites/note-1')).toBe('favorites');
    expect(viewFromPath('/workspace/archive')).toBe('archive');
    expect(viewFromPath('/workspace/notebooks/notebook-1')).toBe('notebooks');
    expect(viewFromPath('/workspace/tags/tag-1')).toBe('tags');
    expect(viewFromPath('/workspace/search?q=notes')).toBe('search');
    expect(viewFromPath('/workspace/trash')).toBe('trash');
  });

  it('builds collection and note URLs', () => {
    expect(collectionPath('notes')).toBe('/workspace/notes');
    expect(collectionPath('tags', 'tag-1')).toBe('/workspace/tags/tag-1');
    expect(collectionPath('notebooks', 'notebook-1')).toBe(
      '/workspace/notebooks/notebook-1',
    );
    expect(notePath('favorites', 'note-1')).toBe('/workspace/favorites/note-1');
    expect(notePath('tags', 'note-1', 'tag-1')).toBe(
      '/workspace/tags/tag-1/note-1',
    );
    expect(notePath('notebooks', 'note-1', 'notebook-1')).toBe(
      '/workspace/notebooks/notebook-1/note-1',
    );
    expect(notePath('search', 'note-1')).toBe('/workspace/search/note-1');
  });

  it('derives the mobile pane from the route note id', () => {
    expect(mobilePaneFromNoteId()).toBe('collection');
    expect(mobilePaneFromNoteId('note-1')).toBe('editor');
  });

  it('preserves search parameters when opening a search result', () => {
    expect(
      searchNotePath('note-1', { toString: () => 'q=ideas&page=2' }),
    ).toBe(
      '/workspace/search/note-1?q=ideas&page=2',
    );
  });
});
