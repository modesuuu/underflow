import { MIN_PASSWORD_LENGTH, USERNAME_PATTERN } from "./mock";
import type { LoginInput, RegisterInput } from "./types";

/**
 * Field errors keyed by field name; an empty object means valid. Pure
 * functions, shared by the forms and the mock "server" so the two cannot
 * drift apart.
 */
export type FieldErrors = Record<string, string>;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateLogin(input: LoginInput): FieldErrors {
  const errors: FieldErrors = {};
  if (!input.username.trim()) errors.username = "Username is required.";
  if (!input.password) errors.password = "Password is required.";
  return errors;
}

export function validateRegister(input: RegisterInput): FieldErrors {
  const errors: FieldErrors = {};
  const username = input.username.trim();
  if (!username) errors.username = "Username is required.";
  else if (!USERNAME_PATTERN.test(username))
    errors.username =
      "Use 3–20 lowercase letters, numbers, dots, underscores, or dashes.";
  if (!input.email.trim()) errors.email = "Email is required.";
  else if (!EMAIL_PATTERN.test(input.email.trim()))
    errors.email = "Enter a valid email address.";
  if (!input.password) errors.password = "Password is required.";
  else if (input.password.length < MIN_PASSWORD_LENGTH)
    errors.password = `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`;
  return errors;
}

export function firstError(errors: FieldErrors): string | undefined {
  return Object.values(errors)[0];
}
