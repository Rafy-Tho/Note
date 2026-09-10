export const IDLE_TIMEOUT_MS = 7 * 24 * 60 * 60 * 1000;
export const ABSOLUTE_TIMEOUT_MS = 30 * 24 * 60 * 60 * 1000;
export const SESSION_TOKEN_BYTES = 32;
export const EMAIL_VERIFICATION_CODE_DIGITS = 6;
export const EMAIL_VERIFICATION_TTL_MS = 10 * 60 * 1000;
export const PASSWORD_RESET_TOKEN_BYTES = 32;
export const PASSWORD_RESET_TTL_MS = 60 * 60 * 1000;
export const PASSWORD_RESET_MAX_ATTEMPTS = 5;
export const AUTH_CALLBACK_STATE_BYTES = 32;
export const AUTH_CALLBACK_STATE_TTL_MS = 10 * 60 * 1000;
export const AUTH_BROWSER_BINDING_COOKIE = 'note_app_oauth_binding';

export function publicUser(user) {
  return {
    id: user.id,
    email: user.email,
    emailVerified: Boolean(user.email_verified_at),
  };
}
