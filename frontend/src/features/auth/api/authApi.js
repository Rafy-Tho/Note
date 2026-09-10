const apiBase = import.meta.env.VITE_API_URL ?? '/api/v1';

async function request(path, options = {}, includeMetadata = false) {
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
  return includeMetadata ? payload : payload.data;
}

export function createAuthApi() {
  let csrfToken = null;

  return {
    async request(path, options = {}) {
      const method = options.method ?? 'GET';
      const headers = {
        ...options.headers,
        ...(method !== 'GET' && method !== 'HEAD' && csrfToken
          ? { 'x-csrf-token': csrfToken }
          : {}),
      };
      return request(path, { ...options, headers });
    },
    async requestCollection(path, options = {}) {
      const method = options.method ?? 'GET';
      const headers = {
        ...options.headers,
        ...(method !== 'GET' && method !== 'HEAD' && csrfToken
          ? { 'x-csrf-token': csrfToken }
          : {}),
      };
      return request(path, { ...options, headers }, true);
    },
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
    async verifyEmail(token) {
      return request('/auth/email/verify', {
        method: 'POST',
        body: JSON.stringify({ token }),
      });
    },
    async resendVerification(email) {
      return request('/auth/email/verification/resend', {
        method: 'POST',
        body: JSON.stringify({ email }),
      });
    },
    async requestPasswordReset(email) {
      return request('/auth/password/reset/request', {
        method: 'POST',
        body: JSON.stringify({ email }),
      });
    },
    async confirmPasswordReset(token, password) {
      return request('/auth/password/reset/confirm', {
        method: 'POST',
        body: JSON.stringify({ token, password }),
      });
    },
    startProviderSignIn(provider) {
      window.location.assign(`${apiBase}/auth/${provider}/start`);
    },
    async startProviderLink(provider) {
      const result = await this.request(`/auth/identities/${provider}/link`, {
        method: 'POST',
      });
      window.location.assign(result.authorizationUrl);
    },
    async listLinkedProviders() {
      return this.request('/auth/identities');
    },
    async unlinkProvider(provider) {
      return this.request(`/auth/identities/${provider}`, {
        method: 'DELETE',
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
      await this.request('/auth/logout', {
        method: 'POST',
      });
      csrfToken = null;
    },
  };
}

export const authApi = createAuthApi();
