# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Next.js 16 (App Router) + React 19 + TypeScript strict + Tailwind v4 (CSS-first). Data layer, mock data, and copy are reused verbatim from `main`; only the presentation layer is in scope.

## Users

University students who need portfolio-grade work to show. Two moments define them:

- **Seeking:** has free hours, wants to join something real, scrolls a feed of open projects and applies.
- **Leading:** has an idea or a half-built project, needs collaborators with specific skills, posts a call and reviews applicants.

They are on desktop, often between classes, often in a browser tab next to coursework. They are not professional project managers and have no patience for tooling ceremony.

## Product Purpose

Stack Underflow is a student collaboration hub. It turns "I want to build something but I'm alone" into a concrete list of projects accepting collaborators, and turns a vague idea into a posted call with a stated skill need and a slot count.

Success is a student applying to at least one project in a session, or publishing a call that reaches people with the right skills.

## Positioning

The mechanism a neighboring product could not copy: the collaboration post carries its own **slot budget** (`slotsFilled / slotsTotal`), so a project's real capacity is visible before anyone applies — no negotiation, no "how many more do you need" thread.

## Operating Context

- Feed is the default landing surface; a right-hand notification panel rides alongside it.
- A project's lifecycle is visible as a status: `not-started`, `pending`, `complete`, `revise`.
- "My Collaborations" is the leader's own board — four status columns, counts computed from the data, not authored.
- Searching, filtering by status, and sorting are part of the daily loop on both the public board and the private one.
- Comments and likes are the social layer; a comment is written on the post detail page, never inline in the feed.

## Capabilities and Constraints

- Routes are fixed: `/`, `/dashboard/[postId]`, `/collaborations`, `/collaborations/[projectId]`, `/my-collaborations`, `/my-collaborations/[category]`, `/my-collaborations/[category]/[projectId]`, plus inbox.
- No backend. `features/*/api.ts` return mock data behind an API-shaped contract; every network-shaped call carries a `TODO(backend)` marker.
- Like state is session-memory only (survives client navigation, resets on hard refresh) — a deliberate stand-in until the like API exists.
- Stacking must never regress: `slotsFilled ≤ slotsTotal` always.
- An unknown category slug, or a category that does not match a project's own `myStatus`, is `notFound()`.
- Terminology is fixed and user-facing: "My Collaborations" (canonical), "Create Project", "Comment", "Feed", "Collaborations".
- Desktop-first. Mobile layout, auth, and dark mode are explicitly out of scope for this build.

## Brand Commitments

- English-language UI copy throughout.
- The heart is an inline SVG, never a font glyph — a font-based heart failed to render in the user's environment and is a known regression.
- Status iconography: Active `file`, Percentage `check`, Pending `history`, Complete `check-circle`, Revise `revision`. Views `show`.
- Icon system is Boxicons; a name that does not exist there is not invented (the revision icon replaced a non-existent `zap`).

## Evidence on Hand

- Real working UI at `main`: 39 frontend files, ~6.5k LOC, 8 routes, mock data with realistic shape.
- No real users, testimonials, benchmarks, or press. **Future work must not fabricate any.**

## Product Principles

1. **Capacity is visible.** Slot counts are a first-class number everywhere a project appears — never a hidden detail behind a click.
2. **The board is computed, not written.** Status counts, filters, and sort derive from the data; a hand-authored statistic is a bug.
3. **Momentum over ceremony.** Applying to a project or publishing a call should be reachable from the surface the student is already on.
4. **The social layer is quiet.** Likes and comments support the work; they never compete with it for attention.
5. **Session truth beats fake persistence.** Where a backend is missing, say so with honest session state, never with invented data.

## Accessibility & Inclusion

- Keyboard reachable throughout; visible focus.
- `prefers-reduced-motion: reduce` is a hard gate: every animation jumps to its final state.
- Text contrast must hold on both the light ground and the dark sidebar.