export function viewFromPath(pathname) {
  if (pathname.startsWith('/workspace/favorites')) return 'favorites';
  if (pathname.startsWith('/workspace/archive')) return 'archive';
  if (pathname.startsWith('/workspace/notebooks')) return 'notebooks';
  if (pathname.startsWith('/workspace/tags')) return 'tags';
  if (pathname.startsWith('/workspace/search')) return 'search';
  if (pathname.startsWith('/workspace/trash')) return 'trash';
  return 'notes';
}

export function collectionPath(view, tagId = '') {
  if (view === 'tags' && tagId) return `/workspace/tags/${tagId}`;
  if (view === 'notebooks' && tagId) return `/workspace/notebooks/${tagId}`;
  return `/workspace/${view}`;
}

export function notePath(view, noteId, tagId = '') {
  if (view === 'tags' && tagId) return `/workspace/tags/${tagId}/${noteId}`;
  if (view === 'notebooks' && tagId)
    return `/workspace/notebooks/${tagId}/${noteId}`;
  return `${collectionPath(view)}/${noteId}`;
}

export function mobilePaneFromNoteId(noteId) {
  return noteId ? 'editor' : 'collection';
}

export function searchNotePath(noteId, searchParams) {
  const query = searchParams.toString();
  return `${notePath('search', noteId)}${query ? `?${query}` : ''}`;
}
