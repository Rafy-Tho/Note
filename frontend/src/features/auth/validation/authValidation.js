const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateCredentials({ email, password }) {
  const fields = {};
  const normalizedEmail = email.trim().toLowerCase();

  if (!emailPattern.test(normalizedEmail) || normalizedEmail.length > 320) {
    fields.email = 'Enter a valid email address.';
  }
  if (password.length < 12 || password.length > 128) {
    fields.password = 'Use a password between 12 and 128 characters.';
  }

  return { fields, credentials: { email: normalizedEmail, password } };
}
