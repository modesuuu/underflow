/**
 * Auth domain types (features/auth).
 *
 * The shapes mirror the real backend (fnCodeee/stackunderflow_BE, reviewed
 * 2026-11-06): a user has one canonical UUID id, login is username-only,
 * the JWT lives 3 days and is returned in the response body. The mock in
 * this folder implements the same shapes so the mock -> fetch swap cannot
 * change call sites (audit P1-A #8).
 */
export interface AuthUser {
  id: string;
  username: string;
  email: string;
  /** Display name. Today this is the username; the profile edit flow owns the real name later. */
  name: string;
  /** Profile photo URL (Cloudinary default or Google photo). Absent for sessions saved before this field existed. */
  photo?: string;
  /** How this session was established. */
  provider: "password" | "google";
}

export interface AuthSession {
  user: AuthUser;
  /** Opaque token. A mock value here; the real backend returns a JWT. */
  token: string;
  /** Epoch ms when the session expires. */
  expiresAt: number;
}

export interface LoginInput {
  username: string;
  password: string;
}

export interface RegisterInput {
  username: string;
  email: string;
  password: string;
}
