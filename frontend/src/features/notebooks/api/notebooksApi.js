import { authApi } from '../../auth/api/authApi.js';

export const notebooksApi = {
  list() {
    return authApi.request('/notebooks');
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
