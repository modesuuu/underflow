# API Contract — Bareng (frontend ↔ backend team)

**Status:** DRAFT v1 — 2026-10-07, for backend team review.
**Scope:** frontend-owned contract. Backend implements to this; frontend codes against it. The current mock layer (`features/collaborations/api.ts`) already uses these function signatures — swapping mock → `fetch` must not change call sites.

## Conventions
- Base: `/api` (same deployment). JSON everywhere (`Content-Type: application/json`), except upload (`multipart/form-data`).
- **Auth:** `Authorization: Bearer <JWT>`. Unauthenticated → `401 { error: { code: "unauthorized", ... } }`; frontend redirects to login (auth UI lands later — backend should still enforce).
- **Errors:** `{ "error": { "code": "snake_case", "message": "human-readable" } }` + proper HTTP status (400 validation, 401 auth, 403 forbidden, 404 not found, 413 file too large, 429 rate limited).
- **Dates:** ISO 8601 strings (`dueDate`, `postedAt`, `createdAt`). The frontend formats for display — no more `"Dec 25, 26"` / `"3d ago"` strings over the wire (this also deletes the frontend's date-parsing hacks for sorting).
- **Pagination:** `?page=1&limit=12` → `{ "data": [...], "meta": { "page": 1, "limit": 12, "total": 87 } }`.

## Endpoints

### Collaborations
| Method | Path | Auth | Notes |
|---|---|---|---|
| GET | `/api/collaborations` | optional | Query: `q` (search title/subtitle/description), `type` (`coursework\|portfolio\|product`), `status` (`open\|in-progress\|completed`), `sort` (`recommended\|due\|newest`), `page`, `limit`. → `200 { data: CollabProject[], meta }` |
| GET | `/api/collaborations/:id` | optional | → `200 { data: CollabProjectDetail }`, `404` unknown id |
| POST | `/api/collaborations` | required | Body: `CreateCollabInput` → `201 { data: CollabProject }`, `400` validation errors |

### Uploads
| Method | Path | Auth | Notes |
|---|---|---|---|
| POST | `/api/upload` | required | `multipart/form-data`, field `photos` (max **5 files**, **5 MB each**, `image/*` only). **Server MUST re-validate** type/size/count — client limits are UX, not security. → `201 { data: { urls: string[] } }`, `413` oversize |

### Applications (proposed — frontend Apply button not wired to an API yet)
| Method | Path | Auth | Notes |
|---|---|---|---|
| POST | `/api/collaborations/:id/apply` | required | Body `{ message?: string }` → `201 { data: Application }`; `409` already applied; `410` project full/closed |
| GET | `/api/collaborations/:id/applications` | required (owner) | → `200 { data: Application[] }`; `403` non-owner |
| PATCH | `/api/applications/:appId` | required (owner) | Body `{ status: "accepted"\|"rejected" }` → `200 { data: Application }` |

### Notifications
| Method | Path | Auth | Notes |
|---|---|---|---|
| GET | `/api/notifications` | required | → `200 { data: Notification[] }` (newest first) |
| PATCH | `/api/notifications/:id/read` | required | → `200 { data: Notification }` |

## Type shapes (source of truth — both sides)

```ts
type ProjectStatus = "open" | "in-progress" | "completed";
type ProjectType = "coursework" | "portfolio" | "product";

interface CollabMember {
  id: string;
  name: string;
  avatarUrl?: string;   // nullable — frontend falls back to placeholder
  role?: string;        // e.g. "Fullstack"
}

interface SkillTag {
  id: string;           // stable id, e.g. "s1"
  label: string;        // e.g. "UI Design"
  icon?: string;        // Boxicons name, e.g. "palette" (frontend-only concern)
}

interface CollabProject {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  status: ProjectStatus;
  type: ProjectType;
  dueDate: string;        // ISO 8601
  postedAt: string;       // ISO 8601
  slotsFilled: number;    // INVARIANT: slotsFilled <= slotsTotal
  slotsTotal: number;
  members: CollabMember[];
  photos: string[];       // URLs, max 5
  skills: SkillTag[];
  owner: CollabMember;
}

interface CollabProjectDetail extends CollabProject {
  about: string;          // long-form, markdown-ish plain text
}

interface CreateCollabInput {
  title: string;          // required, max 120
  description: string;    // required, max 2000
  skillIds: string[];     // references SkillTag.id
  customRoles: string[];  // free-text roles, max 20 each, max 10
  slotsTotal: number;     // 2..10
  type: ProjectType;
  dueDate: string;        // ISO 8601
  photoUrls: string[];    // from POST /api/upload, max 5
}

interface Application {
  id: string;
  projectId: string;
  applicant: CollabMember;
  message?: string;
  status: "pending" | "accepted" | "rejected";
  createdAt: string;      // ISO 8601
}

interface Notification {
  id: string;
  title: string;
  body?: string;
  createdAt: string;      // ISO 8601
  read: boolean;
  link?: string;          // deep link, e.g. "/collaborations/abc123"
}
```

## Open questions for the backend team
1. Auth provider/token shape — who issues the JWT?
2. Image storage/CDN for `/api/upload` URLs (expiry?).
3. Real-time needs later (chat, application updates) — polling acceptable for v1?
4. Rate limits on apply/upload endpoints.

## Frontend mapping notes
- `getCollabProjects()` → `GET /api/collaborations` (+ map query params from filter bar state).
- `createCollabProject()` → upload photos first (`POST /api/upload`), then `POST /api/collaborations` with returned `photoUrls`.
- `postedAgo`/`dueDate` display strings become frontend formatting over ISO dates — the `parseDueDate`/`parsePostedAgo` helpers in `sort.ts` can be deleted once the backend serves ISO.
- `getNotifications()` → `GET /api/notifications`.
