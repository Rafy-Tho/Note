export const IDLE_TIMEOUT_MS = 7 * 24 * 60 * 60 * 1000;
export const ABSOLUTE_TIMEOUT_MS = 30 * 24 * 60 * 60 * 1000;
export const SESSION_TOKEN_BYTES = 32;

export function publicUser(user) {
  return { id: user.id, email: user.email };
}
