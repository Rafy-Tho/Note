import nodemailer from 'nodemailer';
import { AppError } from '../../common/errors/errors.js';
import { URL } from 'node:url';

function mailConfigurationError() {
  return new AppError(
    503,
    'MAIL_UNAVAILABLE',
    'Email delivery is temporarily unavailable.',
  );
}

function createTransport({ host, port, secure, user, password }) {
  if (!host || !user || !password) return null;
  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass: password },
  });
}

export function createSmtpMailService({
  host,
  port,
  secure,
  user,
  password,
  fromEmail,
  fromName,
  appUrl,
  transport,
  logger,
} = {}) {
  const resolvedTransport =
    transport ?? createTransport({ host, port, secure, user, password });

  return {
    async sendVerificationEmail({ to, code }) {
      return sendMail({
        logger,
        transport: resolvedTransport,
        fromEmail,
        fromName,
        appUrl,
        to,
        subject: 'Verify your Oqira email',
        text: `Your Oqira verification code is: ${code}. This code expires in 10 minutes.`,
        html: `<p>Your Oqira verification code is:</p><p><strong>${code}</strong></p><p>This code expires in 10 minutes.</p>`,
      });
    },

    async sendPasswordResetEmail({ to, token }) {
      return sendMail({
        logger,
        transport: resolvedTransport,
        fromEmail,
        fromName,
        appUrl,
        to,
        token,
        path: '/reset-password',
        subject: 'Reset your Oqira password',
        textPrefix: 'Reset your password',
        htmlText: 'Reset your Oqira password using this link.',
      });
    },
  };
}

async function sendMail({
  logger,
  transport,
  fromEmail,
  fromName,
  appUrl,
  to,
  token,
  path,
  subject,
  text,
  html,
  textPrefix,
  htmlText,
}) {
  if (!transport || !fromEmail || !fromName || !appUrl) {
    logger?.warn?.('Mail service is not configured.', {
      missing: [
        !transport && 'SMTP_HOST/SMTP_USER/SMTP_PASSWORD',
        !fromEmail && 'MAIL_FROM',
        !fromName && 'MAIL_FROM_NAME',
        !appUrl && 'APP_URL',
      ].filter(Boolean),
    });
    throw mailConfigurationError();
  }

  const message = {
    from: { name: fromName, address: fromEmail },
    to,
    subject,
  };

  if (token !== undefined) {
    const messageUrl = new URL(path, appUrl);
    messageUrl.searchParams.set('token', token);
    message.text = `${textPrefix}: ${messageUrl}`;
    message.html = `<p>${htmlText}</p><p><a href="${messageUrl}">${textPrefix}</a></p>`;
  } else {
    message.text = text;
    message.html = html;
  }

  try {
    await transport.sendMail(message);
  } catch (error) {
    if (error instanceof AppError) throw error;
    logger?.error?.('Mail delivery failed.', error, {
      responseCode: error?.responseCode,
      command: error?.command,
    });
    throw mailConfigurationError();
  }
}
