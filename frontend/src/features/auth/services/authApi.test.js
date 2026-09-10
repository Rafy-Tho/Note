import { afterEach, describe, expect, it, vi } from 'vitest';
import { createAuthApi } from './authApi.js';

afterEach(() => vi.restoreAllMocks());

function response(body, ok = true, status = 200) {
  return {
    ok,
    status,
    json: vi.fn(async () => body),
  };
}

describe('auth API client', () => {
  it('stores the CSRF token and uses it for state-changing requests', async () => {
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(
        response({
          data: {
            authenticated: true,
            user: { id: 'user-1', emailVerified: true },
            csrfToken: 'csrf-token',
          },
        }),
      )
      .mockResolvedValueOnce(response({ data: { provider: 'google' } }));
    const api = createAuthApi();

    await api.getSession();
    await api.unlinkProvider('google');

    expect(fetchMock.mock.calls[1][1].headers).toMatchObject({
      'x-csrf-token': 'csrf-token',
    });
  });

  it('maps generic reset and verification failures without exposing response internals', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      response(
        {
          error: {
            code: 'PASSWORD_RESET_TOKEN_INVALID',
            message: 'The link is invalid.',
          },
        },
        false,
        400,
      ),
    );
    const api = createAuthApi();

    await expect(
      api.confirmPasswordReset('raw-token', 'new-password'),
    ).rejects.toMatchObject({
      code: 'PASSWORD_RESET_TOKEN_INVALID',
      status: 400,
      message: 'The link is invalid.',
    });
  });

  it('sends the verification code using the code request field', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      response({
        data: {
          authenticated: true,
          user: { id: 'user-1', emailVerified: true },
          csrfToken: 'csrf-token',
        },
      }),
    );
    const api = createAuthApi();

    await api.verifyEmail('518969');

    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({
      code: '518969',
    });
  });
});
