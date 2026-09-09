import { authApi } from '../../auth/api/authApi.js';

export const searchApi = {
  search(query, page = 1) {
    const params = `q=${encodeURIComponent(query)}&page=${page}`;
    return authApi.requestCollection(`/search?${params}`);
  },
};
