import { ApiError, getApiBaseUrl, isApiConfigured } from "@/lib/api-client";
import { MOCK_USERS } from "./mock";
import { addRegisteredUser, getSession, listUsers, setSession } from "./session";
import type { AuthSession, AuthUser, LoginInput, RegisterInput } from "./types";
import { firstError, validateLogin, validateRegister } from "./validation";

/**
 * Auth API. The same contract shape as the other feature modules:
 * functions return domain objects and throw ApiError with a machine `code`
 * on failure, so the mock -> fetch swap cannot change call sites.
 *
 * The mock implements the REAL backend's behaviour (reviewed 2026-11-06):
 * login is username-only, register returns no token (the client signs in
 * afterwards), the token lives 3 days. When NEXT_PUBLIC_API_URL is set,
 * the same functions call the real endpoints; the only extra piece is the
 * envelope adapter, because the backend answers `{ success, message, data }`
 * while the contract expects `{ data, meta }` / `{ error: { code, message } }`.
 */

/** 3 days, in ms — mirrors the backend JWT expiry (utils/JWT.php: 259200s). */
export const TOKEN_TTL_MS = 3 * 24 * 60 * 60 * 1000;

/** Fake network round-trip so the mock behaves like a call, not a local lookup. */
const MOCK_LATENCY_MS = 350;

function mockDelay(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, MOCK_LATENCY_MS));
}

function makeSession(user: AuthUser): AuthSession {
  return {
    user,
    token: `mock-${user.id}-${Date.now()}`,
    expiresAt: Date.now() + TOKEN_TTL_MS,
  };
}

function toAuthUser(record: {
  id: string;
  username: string;
  email?: string | null;
}): AuthUser {
  return {
    id: record.id,
    username: record.username,
    email: record.email ?? "",
    name: record.username,
    provider: "password",
  };
}

export async function login(input: LoginInput): Promise<AuthSession> {
  const errors = validateLogin(input);
  if (Object.keys(errors).length > 0) {
    throw new ApiError(
      400,
      "validation_error",
      firstError(errors) ?? "Check the form and try again.",
    );
  }
  if (isApiConfigured()) return loginViaBackend(input);
  await mockDelay();
  const user = listUsers().find((u) => u.username === input.username.trim());
  if (!user || user.password !== input.password) {
    throw new ApiError(401, "invalid_credentials", "Username or password is incorrect.");
  }
  const session = makeSession(user);
  setSession(session);
  return session;
}

export async function register(input: RegisterInput): Promise<AuthSession> {
  const errors = validateRegister(input);
  if (Object.keys(errors).length > 0) {
    throw new ApiError(
      400,
      "validation_error",
      firstError(errors) ?? "Check the form and try again.",
    );
  }
  if (isApiConfigured()) return registerViaBackend(input);
  await mockDelay();
  const username = input.username.trim();
  const email = input.email.trim();
  const users = listUsers();
  if (users.some((u) => u.username === username)) {
    throw new ApiError(409, "username_taken", "That username is already taken.");
  }
  if (users.some((u) => u.email.toLowerCase() === email.toLowerCase())) {
    throw new ApiError(409, "email_taken", "An account with this email already exists.");
  }
  const user = {
    id: crypto.randomUUID(),
    username,
    email,
    name: username,
    provider: "password" as const,
    password: input.password,
  };
  addRegisteredUser(user);
  // The backend's register returns no token, so the client signs in right after.
  return login({ username, password: input.password });
}

/**
 * Mock Google sign-in. There is no OAuth on the backend yet, so this signs
 * in as the Google-linked demo account (Russel) instead of pretending to
 * open a Google popup. TODO(backend): replace with the real Google OAuth
 * flow (redirect -> callback -> token exchange).
 */
export async function signInWithGoogle(): Promise<AuthSession> {
  await mockDelay();
  const seed = MOCK_USERS.find((u) => u.username === "russel");
  if (!seed) {
    throw new ApiError(500, "validation_error", "Demo account is missing.");
  }
  const session = makeSession({ ...seed, provider: "google" });
  setSession(session);
  return session;
}

export async function getMe(): Promise<AuthUser | null> {
  const current = getSession();
  if (!current) return null;
  if (current.expiresAt <= Date.now()) {
    setSession(null);
    return null;
  }
  return current.user;
}

/** Client-side only: the backend has no logout endpoint, the token is simply discarded. */
export function logout(): void {
  setSession(null);
}

/* --- Real-backend path (dormant until NEXT_PUBLIC_API_URL is set) --- */

interface BackendEnvelope<T> {
  success: boolean;
  message: string;
  data: T | null;
}

async function readBackendEnvelope<T>(res: Response): Promise<BackendEnvelope<T>> {
  try {
    return (await res.json()) as BackendEnvelope<T>;
  } catch {
    return { success: false, message: res.statusText, data: null };
  }
}

async function loginViaBackend(input: LoginInput): Promise<AuthSession> {
  const res = await fetch(`${getApiBaseUrl()}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: input.username.trim(), password: input.password }),
  });
  const body = await readBackendEnvelope<{
    id: string;
    username: string;
    token: string;
    email?: string | null;
  }>(res);
  if (!res.ok || !body.success || !body.data?.token) {
    throw new ApiError(
      res.status,
      "invalid_credentials",
      body.message || "Username or password is incorrect.",
    );
  }
  const session: AuthSession = {
    user: toAuthUser(body.data),
    token: body.data.token,
    expiresAt: Date.now() + TOKEN_TTL_MS,
  };
  setSession(session);
  return session;
}

async function registerViaBackend(input: RegisterInput): Promise<AuthSession> {
  const res = await fetch(`${getApiBaseUrl()}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username: input.username.trim(),
      email: input.email.trim(),
      password: input.password,
    }),
  });
  const body = await readBackendEnvelope<{ id: string; username: string }>(res);
  if (!res.ok || !body.success) {
    const code = res.status === 409 ? "username_taken" : "validation_error";
    throw new ApiError(res.status, code, body.message || "Could not create the account.");
  }
  return loginViaBackend({ username: input.username, password: input.password });
}
