import { authApi } from '../../auth/services/authApi.js';

export const workspaceApi = {
  getSidebarCounts(options = {}) {
    return authApi.request('/workspace/sidebar-counts', options);
  },
};
