import { describe, expect, it, vi } from 'vitest';
import { createBrevoMailService } from '../../src/modules/auth/mail.service.js';

describe('authentication mail service', () => {
  it('sends verification mail through Brevo without exposing configuration', async () => {
    const fetchImpl = vi.fn(async () => ({ ok: true }));
    const service = createBrevoMailService({
      apiKey: 'brevo-secret',
      fromEmail: 'notes@example.com',
      fromName: 'Note App',
      appUrl: 'https://notes.example.com',
      fetchImpl,
    });

    await service.sendVerificationEmail({
      to: 'user@example.com',
      code: '482913',
    });

    expect(fetchImpl).toHaveBeenCalledWith(
      'https://api.brevo.com/v3/smtp/email',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'api-key': 'brevo-secret',
        }),
      }),
    );
    const body = JSON.parse(fetchImpl.mock.calls[0][1].body);
    expect(body).toMatchObject({
      sender: { email: 'notes@example.com', name: 'Note App' },
      to: [{ email: 'user@example.com' }],
    });
    expect(body.textContent).toContain(
      'Your Note App verification code is: 482913',
    );
  });

  it('converts provider failures into a safe mail error', async () => {
    const service = createBrevoMailService({
      apiKey: 'brevo-secret',
      fromEmail: 'notes@example.com',
      fromName: 'Note App',
      appUrl: 'https://notes.example.com',
      fetchImpl: vi.fn(async () => ({ ok: false })),
    });

    await expect(
      service.sendVerificationEmail({
        to: 'user@example.com',
        code: '482913',
      }),
    ).rejects.toMatchObject({
      status: 503,
      code: 'MAIL_UNAVAILABLE',
    });
  });

  it('uses a password-reset route for reset messages', async () => {
    const fetchImpl = vi.fn(async () => ({ ok: true }));
    const service = createBrevoMailService({
      apiKey: 'brevo-secret',
      fromEmail: 'notes@example.com',
      fromName: 'Note App',
      appUrl: 'https://notes.example.com',
      fetchImpl,
    });

    await service.sendPasswordResetEmail({
      to: 'user@example.com',
      token: 'reset-token',
    });

    const body = JSON.parse(fetchImpl.mock.calls[0][1].body);
    expect(body.subject).toBe('Reset your Note App password');
    expect(body.textContent).toContain(
      'https://notes.example.com/reset-password?token=reset-token',
    );
  });
});
