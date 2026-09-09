import { authApi } from '../../auth/api/authApi.js';

export const notesApi = {
  list(filters = {}) {
    const params = Object.entries(filters)
      .filter(
        ([, value]) => value !== undefined && value !== null && value !== '',
      )
      .map(
        ([key, value]) =>
          `${encodeURIComponent(key)}=${encodeURIComponent(value)}`,
      )
      .join('&');
    return authApi.request(`/notes${params ? `?${params}` : ''}`);
  },
  listTrash() {
    return authApi.request('/trash');
  },
  create(note) {
    return authApi.request('/notes', {
      method: 'POST',
      body: JSON.stringify(note),
    });
  },
  get(noteId) {
    return authApi.request(`/notes/${noteId}`);
  },
  update(noteId, note) {
    return authApi.request(`/notes/${noteId}`, {
      method: 'PATCH',
      body: JSON.stringify(note),
    });
  },
  trash(noteId) {
    return authApi.request(`/notes/${noteId}`, { method: 'DELETE' });
  },
  restore(noteId) {
    return authApi.request(`/notes/${noteId}/restore`, { method: 'POST' });
  },
  listFavorites() {
    return authApi.request('/favorites');
  },
  archive(noteId) {
    return authApi.request(`/notes/${noteId}/archive`, { method: 'POST' });
  },
  unarchive(noteId) {
    return authApi.request(`/notes/${noteId}/unarchive`, { method: 'POST' });
  },
  favorite(noteId) {
    return authApi.request(`/notes/${noteId}/favorite`, { method: 'POST' });
  },
  unfavorite(noteId) {
    return authApi.request(`/notes/${noteId}/favorite`, { method: 'DELETE' });
  },
  permanentlyDelete(noteId) {
    return authApi.request(`/notes/${noteId}/permanent`, { method: 'DELETE' });
  },
  assignNotebook(noteId, notebookId) {
    return authApi.request(`/notes/${noteId}/notebook`, {
      method: 'PUT',
      body: JSON.stringify({ notebookId }),
    });
  },
};
