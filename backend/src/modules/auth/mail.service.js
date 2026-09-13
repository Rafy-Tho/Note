import { Configuration, SendApi } from '@hostinger/mail-sdk';
import { AppError } from '../../common/errors/errors.js';
import { URL } from 'node:url';

function mailConfigurationError() {
  return new AppError(
    503,
    'MAIL_UNAVAILABLE',
    'Email delivery is temporarily unavailable.',
  );
}

function createSendClient({ accessToken, basePath }) {
  if (!accessToken) return null;
  const configuration = new Configuration({
    accessToken,
    ...(basePath ? { basePath } : {}),
  });
  return new SendApi(configuration);
}

export function createHostingerMailService({
  accessToken,
  mailboxResourceId,
  basePath,
  fromEmail,
  fromName,
  appUrl,
  client,
  logger,
} = {}) {
  const resolvedClient = client ?? createSendClient({ accessToken, basePath });

  return {
    async sendVerificationEmail({ to, code }) {
      return sendMail({
        logger,
        client: resolvedClient,
        mailboxResourceId,
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
        client: resolvedClient,
        mailboxResourceId,
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
  client,
  mailboxResourceId,
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
  if (!client || !mailboxResourceId || !fromEmail || !fromName || !appUrl) {
    logger?.warn?.('Mail service is not configured.', {
      missing: [
        !client && 'HOSTINGER_API_TOKEN',
        !mailboxResourceId && 'HOSTINGER_MAILBOX_RESOURCE_ID',
        !fromEmail && 'MAIL_FROM',
        !fromName && 'MAIL_FROM_NAME',
        !appUrl && 'APP_URL',
      ].filter(Boolean),
    });
    throw mailConfigurationError();
  }

  const message = {
    to: [to],
    displayName: fromName,
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
    await client.sendEmail(mailboxResourceId, message);
  } catch (error) {
    if (error instanceof AppError) throw error;
    logger?.error?.('Mail delivery failed.', error, {
      status: error?.response?.status,
      providerCode: error?.response?.data?.code,
    });
    throw mailConfigurationError();
  }
}
