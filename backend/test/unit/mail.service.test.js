import { describe, expect, it, vi } from 'vitest';
import { createSmtpMailService } from '../../src/modules/auth/mail.service.js';

describe('authentication mail service', () => {
  it('sends verification mail through SMTP without exposing configuration', async () => {
    const transport = { sendMail: vi.fn(async () => ({ messageId: '1' })) };
    const service = createSmtpMailService({
      fromEmail: 'notes@example.com',
      fromName: 'Oqira',
      appUrl: 'https://notes.example.com',
      transport,
    });

    await service.sendVerificationEmail({
      to: 'user@example.com',
      code: '482913',
    });

    expect(transport.sendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        from: { name: 'Oqira', address: 'notes@example.com' },
        to: 'user@example.com',
        subject: 'Verify your Oqira email',
      }),
    );
    const message = transport.sendMail.mock.calls[0][0];
    expect(message.text).toContain('Your Oqira verification code is: 482913');
  });

  it('converts provider failures into a safe mail error', async () => {
    const transport = {
      sendMail: vi.fn(async () => {
        throw new Error('smtp rejected the message');
      }),
    };
    const service = createSmtpMailService({
      fromEmail: 'notes@example.com',
      fromName: 'Oqira',
      appUrl: 'https://notes.example.com',
      transport,
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

  it('logs a redacted provider error when delivery fails', async () => {
    const transport = {
      sendMail: vi.fn(async () => {
        const error = new Error('invalid login');
        error.code = 'EAUTH';
        error.responseCode = 535;
        throw error;
      }),
    };
    const logger = { warn: vi.fn(), error: vi.fn() };
    const service = createSmtpMailService({
      fromEmail: 'notes@example.com',
      fromName: 'Oqira',
      appUrl: 'https://notes.example.com',
      transport,
      logger,
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

    expect(logger.error).toHaveBeenCalledWith(
      'Mail delivery failed.',
      expect.objectContaining({ code: 'EAUTH' }),
      expect.objectContaining({ responseCode: 535 }),
    );
    const logged = JSON.stringify(logger.error.mock.calls);
    expect(logged).not.toContain('482913');
    expect(logged).not.toContain('user@example.com');
  });

  it('warns without leaking configuration when mail is not configured', async () => {
    const logger = { warn: vi.fn(), error: vi.fn() };
    const service = createSmtpMailService({
      fromEmail: 'notes@example.com',
      fromName: 'Oqira',
      appUrl: 'https://notes.example.com',
      logger,
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

    expect(logger.warn).toHaveBeenCalledWith(
      'Mail service is not configured.',
      expect.objectContaining({ missing: expect.any(Array) }),
    );
  });

  it('uses a password-reset route for reset messages', async () => {
    const transport = { sendMail: vi.fn(async () => ({ messageId: '1' })) };
    const service = createSmtpMailService({
      fromEmail: 'notes@example.com',
      fromName: 'Oqira',
      appUrl: 'https://notes.example.com',
      transport,
    });

    await service.sendPasswordResetEmail({
      to: 'user@example.com',
      token: 'reset-token',
    });

    const message = transport.sendMail.mock.calls[0][0];
    expect(message.subject).toBe('Reset your Oqira password');
    expect(message.text).toContain(
      'https://notes.example.com/reset-password?token=reset-token',
    );
  });
});
