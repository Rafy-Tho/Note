import { AppError } from '../../common/errors.js';
import { URL } from 'node:url';

function mailConfigurationError() {
  return new AppError(
    503,
    'MAIL_UNAVAILABLE',
    'Email delivery is temporarily unavailable.',
  );
}

export function createBrevoMailService({
  apiKey,
  fromEmail,
  fromName,
  appUrl,
  fetchImpl = globalThis.fetch,
} = {}) {
  return {
    async sendVerificationEmail({ to, code }) {
      return sendCodeEmail({
        apiKey,
        fromEmail,
        fromName,
        appUrl,
        fetchImpl,
        to,
        subject: 'Verify your Note App email',
        text: `Your Note App verification code is: ${code}. This code expires in 10 minutes.`,
        html: `<p>Your Note App verification code is:</p><p><strong>${code}</strong></p><p>This code expires in 10 minutes.</p>`,
      });
    },

    async sendPasswordResetEmail({ to, token }) {
      return sendEmail({
        apiKey,
        fromEmail,
        fromName,
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

async function sendCodeEmail({
  apiKey,
  fromEmail,
  fromName,
  appUrl,
  fetchImpl,
  to,
  subject,
  text,
  html,
}) {
  if (!apiKey || !fromEmail || !fromName || !appUrl)
    throw mailConfigurationError();

  try {
    const response = await fetchImpl('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'api-key': apiKey,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        sender: { email: fromEmail, name: fromName },
        to: [{ email: to }],
        subject,
        textContent: text,
        htmlContent: html,
      }),
    });

    if (!response.ok) throw mailConfigurationError();
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw mailConfigurationError();
  }
}

async function sendEmail({
  apiKey,
  fromEmail,
  fromName,
  appUrl,
  fetchImpl,
  to,
  token,
  path,
  subject,
  textPrefix,
  htmlText,
}) {
  if (!apiKey || !fromEmail || !fromName || !appUrl)
    throw mailConfigurationError();

  const messageUrl = new URL(path, appUrl);
  messageUrl.searchParams.set('token', token);
  try {
    const response = await fetchImpl('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'api-key': apiKey,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        sender: { email: fromEmail, name: fromName },
        to: [{ email: to }],
        subject,
        textContent: `${textPrefix}: ${messageUrl}`,
        htmlContent: `<p>${htmlText}</p><p><a href="${messageUrl}">${textPrefix}</a></p>`,
      }),
    });

    if (!response.ok) throw mailConfigurationError();
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw mailConfigurationError();
  }
}
