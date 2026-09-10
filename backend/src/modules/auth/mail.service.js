import { AppError } from '../../common/errors.js';
import { URL } from 'node:url';

function mailConfigurationError() {
  return new AppError(
    503,
    'MAIL_UNAVAILABLE',
    'Email delivery is temporarily unavailable.',
  );
}

export function createResendMailService({
  apiKey,
  fromAddress,
  appUrl,
  fetchImpl = globalThis.fetch,
} = {}) {
  return {
    async sendVerificationEmail({ to, token }) {
      return sendEmail({
        apiKey,
        fromAddress,
        appUrl,
        fetchImpl,
        to,
        token,
        path: '/verify-email',
        subject: 'Verify your Note App email',
        textPrefix: 'Verify your email address',
        htmlText: 'Verify your email address to access your private notes.',
      });
    },

    async sendPasswordResetEmail({ to, token }) {
      return sendEmail({
        apiKey,
        fromAddress,
        appUrl,
        fetchImpl,
        to,
        token,
        path: '/reset-password',
        subject: 'Reset your Note App password',
        textPrefix: 'Reset your password',
        htmlText: 'Reset your Note App password using this link.',
      });
    },
  };
}

async function sendEmail({
  apiKey,
  fromAddress,
  appUrl,
  fetchImpl,
  to,
  token,
  path,
  subject,
  textPrefix,
  htmlText,
}) {
  if (!apiKey || !fromAddress || !appUrl) throw mailConfigurationError();

  const messageUrl = new URL(path, appUrl);
  messageUrl.searchParams.set('token', token);
  try {
    const response = await fetchImpl('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        authorization: `Bearer ${apiKey}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        from: fromAddress,
        to: [to],
        subject,
        text: `${textPrefix}: ${messageUrl}`,
        html: `<p>${htmlText}</p><p><a href="${messageUrl}">${textPrefix}</a></p>`,
      }),
    });

    if (!response.ok) throw mailConfigurationError();
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw mailConfigurationError();
  }
}
