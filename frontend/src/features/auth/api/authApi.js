const apiBase = import.meta.env.VITE_API_URL ?? '/api/v1';

async function request(path, options = {}) {
  const response = await fetch(`${apiBase}${path}`, {
    ...options,
    credentials: 'include',
    headers: {
      ...(options.body ? { 'content-type': 'application/json' } : {}),
      ...options.headers,
    },
  });

  if (response.status === 204) return null;
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(
      payload.error?.message ?? 'The request could not be completed.',
    );
    error.code = payload.error?.code;
    error.fields = payload.error?.fields;
    error.status = response.status;
    throw error;
  }
  return payload.data;
}

export function createAuthApi() {
  let csrfToken = null;

  return {
    async getSession() {
      const session = await request('/auth/session');
      csrfToken = session.csrfToken;
      return session;
    },
    async register(credentials) {
      return request('/auth/register', {
        method: 'POST',
        body: JSON.stringify(credentials),
      });
    },
    async login(credentials) {
      const session = await request('/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
      });
      csrfToken = session.csrfToken;
      return session;
    },
    async logout() {
      await request('/auth/logout', {
        method: 'POST',
        headers: { 'x-csrf-token': csrfToken ?? '' },
      });
      csrfToken = null;
    },
  };
}

export const authApi = createAuthApi();
