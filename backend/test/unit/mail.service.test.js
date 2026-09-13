import { describe, expect, it, vi } from 'vitest';
import { createHostingerMailService } from '../../src/modules/auth/mail.service.js';

function createClient() {
  return { sendEmail: vi.fn(async () => ({})) };
}

describe('authentication mail service', () => {
  it('sends verification mail through the Hostinger API without exposing configuration', async () => {
    const client = createClient();
    const service = createHostingerMailService({
      mailboxResourceId: 'mbx_123',
      fromEmail: 'notes@example.com',
      fromName: 'Oqira',
      appUrl: 'https://notes.example.com',
      client,
    });

    await service.sendVerificationEmail({
      to: 'user@example.com',
      code: '482913',
    });

    expect(client.sendEmail).toHaveBeenCalledWith(
      'mbx_123',
      expect.objectContaining({
        to: ['user@example.com'],
        displayName: 'Oqira',
        subject: 'Verify your Oqira email',
      }),
    );
    const message = client.sendEmail.mock.calls[0][1];
    expect(message.text).toContain('Your Oqira verification code is: 482913');
  });

  it('converts provider failures into a safe mail error', async () => {
    const client = {
      sendEmail: vi.fn(async () => {
        throw new Error('hostinger rejected the message');
      }),
    };
    const service = createHostingerMailService({
      mailboxResourceId: 'mbx_123',
      fromEmail: 'notes@example.com',
      fromName: 'Oqira',
      appUrl: 'https://notes.example.com',
      client,
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
    const client = {
      sendEmail: vi.fn(async () => {
        const error = new Error('invalid token');
        error.response = {
          status: 401,
          data: { code: 'INVALID_TOKEN' },
        };
        throw error;
      }),
    };
    const logger = { warn: vi.fn(), error: vi.fn() };
    const service = createHostingerMailService({
      mailboxResourceId: 'mbx_123',
      fromEmail: 'notes@example.com',
      fromName: 'Oqira',
      appUrl: 'https://notes.example.com',
      client,
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
      expect.objectContaining({ name: 'Error' }),
      expect.objectContaining({ status: 401, providerCode: 'INVALID_TOKEN' }),
    );
    const logged = JSON.stringify(logger.error.mock.calls);
    expect(logged).not.toContain('482913');
    expect(logged).not.toContain('user@example.com');
  });

  it('warns without leaking configuration when mail is not configured', async () => {
    const logger = { warn: vi.fn(), error: vi.fn() };
    const service = createHostingerMailService({
      mailboxResourceId: 'mbx_123',
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

  it('warns when the mailbox resource id is missing', async () => {
    const logger = { warn: vi.fn(), error: vi.fn() };
    const client = createClient();
    const service = createHostingerMailService({
      fromEmail: 'notes@example.com',
      fromName: 'Oqira',
      appUrl: 'https://notes.example.com',
      client,
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
      expect.objectContaining({
        missing: expect.arrayContaining(['HOSTINGER_MAILBOX_RESOURCE_ID']),
      }),
    );
  });

  it('uses a password-reset route for reset messages', async () => {
    const client = createClient();
    const service = createHostingerMailService({
      mailboxResourceId: 'mbx_123',
      fromEmail: 'notes@example.com',
      fromName: 'Oqira',
      appUrl: 'https://notes.example.com',
      client,
    });

    await service.sendPasswordResetEmail({
      to: 'user@example.com',
      token: 'reset-token',
    });

    const message = client.sendEmail.mock.calls[0][1];
    expect(message.subject).toBe('Reset your Oqira password');
    expect(message.text).toContain(
      'https://notes.example.com/reset-password?token=reset-token',
    );
  });
});
