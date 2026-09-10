import { authApi } from '../../auth/services/authApi.js';

export const notebooksApi = {
  list(options = {}) {
    return authApi.request('/notebooks', options);
  },
  create(name) {
    return authApi.request('/notebooks', {
      method: 'POST',
      body: JSON.stringify({ name }),
    });
  },
  rename(notebookId, name) {
    return authApi.request(`/notebooks/${notebookId}`, {
      method: 'PATCH',
      body: JSON.stringify({ name }),
    });
  },
  remove(notebookId) {
    return authApi.request(`/notebooks/${notebookId}`, { method: 'DELETE' });
  },
};
