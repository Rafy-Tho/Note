import { authApi } from '../../auth/api/authApi.js';

export const notesApi = {
  list() {
    return authApi.request('/notes');
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
};
