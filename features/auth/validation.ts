import type { LoginInput, RegisterInput } from "./types";

/**
 * Frontend product rules (moved from the deleted mock store — these
 * are validation constants, not mock data). The backend enforces
 * none of these yet; the message to the team proposes them.
 */
export const USERNAME_PATTERN = /^[a-z0-9._-]{3,20}$/;
export const MIN_PASSWORD_LENGTH = 8;

/**
 * Field errors keyed by field name; an empty object means valid. Pure
 * functions, shared by the forms and the mock "server" so the two cannot
 * drift apart. VALUES ARE DICTIONARY KEYS (lib/i18n) — the forms
 * translate them before display; the password-length key mirrors
 * MIN_PASSWORD_LENGTH in its copy.
 */
export type FieldErrors = Record<string, string>;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateLogin(input: LoginInput): FieldErrors {
  const errors: FieldErrors = {};
  if (!input.username.trim()) errors.username = "auth.errUsernameRequired";
  if (!input.password) errors.password = "auth.errPasswordRequired";
  return errors;
}

export function validateRegister(input: RegisterInput): FieldErrors {
  const errors: FieldErrors = {};
  const username = input.username.trim();
  if (!username) errors.username = "auth.errUsernameRequired";
  else if (!USERNAME_PATTERN.test(username))
    errors.username =
      "auth.errUsernamePattern";
  if (!input.email.trim()) errors.email = "auth.errEmailRequired";
  else if (!EMAIL_PATTERN.test(input.email.trim()))
    errors.email = "auth.errEmailInvalid";
  if (!input.password) errors.password = "auth.errPasswordRequired";
  else if (input.password.length < MIN_PASSWORD_LENGTH)
    errors.password = "auth.errPasswordLength";
  return errors;
}

export function firstError(errors: FieldErrors): string | undefined {
  return Object.values(errors)[0];
}
