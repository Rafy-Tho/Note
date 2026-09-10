import { authApi } from '../../auth/services/authApi.js';

export const tagsApi = {
  list(options = {}) {
    return authApi.request('/tags', options);
  },
  create(name) {
    return authApi.request('/tags', {
      method: 'POST',
      body: JSON.stringify({ name }),
    });
  },
  rename(tagId, name) {
    return authApi.request(`/tags/${tagId}`, {
      method: 'PATCH',
      body: JSON.stringify({ name }),
    });
  },
  delete(tagId) {
    return authApi.request(`/tags/${tagId}`, { method: 'DELETE' });
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
  listNotes(tagId, options = {}) {
    return authApi.request(`/tags/${tagId}/notes`, options);
  },
};
