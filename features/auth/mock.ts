import type { AuthUser } from "./types";

/**
 * Mock user store. Demo accounts only — passwords are plaintext here on
 * purpose: this store never leaves the browser and is never sent to a
 * server. The real backend hashes with bcrypt (see the backend review,
 * 2026-11-06). TODO(backend): delete this file when POST /api/auth/*
 * goes live; the api.ts signatures stay the same.
 */
export interface MockUser extends AuthUser {
  password: string;
}

/** Seeded demo accounts. Russel is the account the demo filler and the mock Google sign-in use. */
export const MOCK_USERS: MockUser[] = [
  {
    id: "user-russel",
    username: "russel",
    email: "russel@underflow.app",
    name: "Russel",
    provider: "password",
    password: "underflow123",
  },
  {
    id: "user-kimi",
    username: "kimi",
    email: "kimi@underflow.app",
    name: "Kimi",
    provider: "password",
    password: "underflow123",
  },
];

/** What the "Use the demo account" filler types into the login form. */
export const DEMO_ACCOUNT = { username: "russel", password: "underflow123" };

/**
 * Frontend product rules. The backend enforces none of these yet — the
 * message to the team proposes them (pesan-ke-tim-backend-auth-2026-11-06.md).
 */
export const USERNAME_PATTERN = /^[a-z0-9._-]{3,20}$/;
export const MIN_PASSWORD_LENGTH = 8;
