import { authApi } from '../../auth/api/authApi.js';

export const notesApi = {
  list() {
    return authApi.request('/notes');
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
};
