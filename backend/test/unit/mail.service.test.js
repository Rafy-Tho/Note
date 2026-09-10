import { describe, expect, it, vi } from 'vitest';
import { createResendMailService } from '../../src/modules/auth/mail.service.js';

describe('authentication mail service', () => {
  it('sends verification mail through Resend without exposing configuration', async () => {
    const fetchImpl = vi.fn(async () => ({ ok: true }));
    const service = createResendMailService({
      apiKey: 'resend-secret',
      fromAddress: 'notes@example.com',
      appUrl: 'https://notes.example.com',
      fetchImpl,
    });

    await service.sendVerificationEmail({
      to: 'user@example.com',
      token: 'verification-token',
    });

    expect(fetchImpl).toHaveBeenCalledWith(
      'https://api.resend.com/emails',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          authorization: 'Bearer resend-secret',
        }),
      }),
    );
    const body = JSON.parse(fetchImpl.mock.calls[0][1].body);
    expect(body).toMatchObject({
      from: 'notes@example.com',
      to: ['user@example.com'],
    });
    expect(body.text).toContain(
      'https://notes.example.com/verify-email?token=verification-token',
    );
  });

  it('converts provider failures into a safe mail error', async () => {
    const service = createResendMailService({
      apiKey: 'resend-secret',
      fromAddress: 'notes@example.com',
      appUrl: 'https://notes.example.com',
      fetchImpl: vi.fn(async () => ({ ok: false })),
    });

    await expect(
      service.sendVerificationEmail({
        to: 'user@example.com',
        token: 'verification-token',
      }),
    ).rejects.toMatchObject({
      status: 503,
      code: 'MAIL_UNAVAILABLE',
    });
  });

  it('uses a password-reset route for reset messages', async () => {
    const fetchImpl = vi.fn(async () => ({ ok: true }));
    const service = createResendMailService({
      apiKey: 'resend-secret',
      fromAddress: 'notes@example.com',
      appUrl: 'https://notes.example.com',
      fetchImpl,
    });

    await service.sendPasswordResetEmail({
      to: 'user@example.com',
      token: 'reset-token',
    });

    const body = JSON.parse(fetchImpl.mock.calls[0][1].body);
    expect(body.subject).toBe('Reset your Note App password');
    expect(body.text).toContain(
      'https://notes.example.com/reset-password?token=reset-token',
    );
  });
});
