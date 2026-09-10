import { authApi } from '../../auth/services/authApi.js';

export const tagsApi = {
  list() {
    return authApi.request('/tags');
  },
  create(name) {
    return authApi.request('/tags', {
      method: 'POST',
      body: JSON.stringify({ name }),
    });
  },
  listForNote(noteId) {
    return authApi.request(`/notes/${noteId}/tags`);
  },
  assign(noteId, tagId) {
    return authApi.request(`/notes/${noteId}/tags`, {
      method: 'POST',
      body: JSON.stringify({ tagId }),
    });
  },
  remove(noteId, tagId) {
    return authApi.request(`/notes/${noteId}/tags/${tagId}`, {
      method: 'DELETE',
    });
  },
  listNotes(tagId) {
    return authApi.request(`/tags/${tagId}/notes`);
  },
};
