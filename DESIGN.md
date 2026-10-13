# Bareng — Design System (version A, "Recommendation")

The written contract for the version-A design: the shell, the tokens, the
typography, the component language, the motion, and what is explicitly not
allowed. Version A is the design currently on `main`, extended with four
adopted patterns from the two AI design rounds (notifications drawer, stat
register, capacity strip + figures mono, token discipline). This document is
the source of truth for the next round — if a change contradicts a section
below, it is a bug, not an evolution.

## 1. Shell

- **Two zones.** Left sidebar 246px (`--uf-sidebar-w`) + main area. The fixed
  308px right notification rail is gone; the notification surface is now a
  slide-over drawer (`--uf-panel-w` lives on as the drawer width). The main
  area takes the freed width; the content column does **not** widen.
- **Sidebar.** Labeled navigation (`components/layout/Sidebar.tsx`), pill
  indicator for the active route, hover row treatment.
- **TopBar.** Sticky 79px. Left: back chevron (when a route passes one) +
  breadcrumb. Right: the notification bell (permanent, unread badge) and the
  route's `actions` slot.
- **Content column.** Centered, `--uf-content-w` 636px max on detail/feed
  surfaces. Feed and post detail keep this width; the area around it is air.
- **Board (`/my-collaborations`).** Heading + one stat register strip +
  search/sort/filter toolbar + four status columns. Columns are cards
  (`rounded-xl`, surface) with a status pill and up to 2 cards each before the
  "view all" affordance.

## 2. Tokens

All color, radius, width and easing decisions live in
`app/styles/tokens.css` and are mapped to Tailwind utilities in
`app/globals.css` under `@theme inline`. Components reference utilities
(`bg-surface`, `border-line`, …), never raw hex.

| Token | Value | Job |
| --- | --- | --- |
| `--uf-bg` | `#f1f0ee` | App background |
| `--uf-surface` | `#ffffff` | Cards, columns, drawer, inputs |
| `--uf-ink` | `#000000` | Text, filled ticks, solid icon chips |
| `--uf-muted` | `#6d6c6a` | Secondary text |
| `--uf-subtle` | `#8e8e93` | Tertiary text, figure captions |
| `--uf-line` | `#d5d3cf` | **Hairline** — dividers and borders only |
| `--uf-placeholder` | `#d9d9d9` | Skeleton blocks |
| `--uf-charcoal` | `#3a3a3a` | Avatar/initials placeholder fill |
| `--uf-accent` | `#dff66a` (lime) | **One accent, one job list** — see below |
| `--uf-badge` | `#ff383c` | Unread dots/counts only |
| `--uf-heart` | `#ff2d55` | Liked hearts only |

- **Hairline ≠ muted text.** `--uf-line` used to equal `#6d6c6a`, which made
  every divider read as disabled text. It is now lighter than any text token.
- **Accent discipline.** Lime appears only as: (a) primary actions — Create
  Project, Apply, modal submit, error/not-found retry; (b) selection states —
  picked filter/sort option, selected role chips, the stepper button; (c) the
  capacity highlight (the filled count in a capacity strip). Focus rings are
  `ring-accent` because a ring is a selection affordance. If lime shows up
  anywhere else, it is wrong.
- **Status surfaces are never hue-only.** Every board/category status pairs
  its tint with an icon and a text label: not-started (neutral + group),
  pending (badge tint + loader), complete (accent tint + check-circle),
  revise (accent tint + revision).

Radius: `sm` 4px, `md` 6px, `lg` 12px (blocks, inputs, register strip,
drawer), `xl` 20px (cards), `pill` 100px (pills, badges). Easing: a single
`--uf-ease-out` (`cubic-bezier(0.23, 1, 0.32, 1)`) for every entrance and
exit — no ease-in on exits.

## 3. Typography

- **Body: PP Neue Montreal**, self-hosted (`/font/ppneuemontreal-*.otf`), one
  variable axis of weights (book 400 / medium 500 / semibold 600 / bold 700).
  Type scale is the 10px-slot Figma scale; Tailwind `xs/sm/base/xl` map to
  12/14/16/20, plus a `text-2xs` 10px slot.
- **Figures: Spline Sans Mono**, self-hosted variable font
  (`/fonts/spline-sans-mono-*.woff2`), exposed as `--font-figures` →
  `font-figures`. Applied **only to numerals**: board stat values, like/view
  counts, post and comment timestamps, due dates, capacity counts, unread
  badge. Body text, labels and headings never use it. Figures also use
  `tabular-nums`.
- Headings are PP Neue Montreal medium; the board heading is 40px/1.02. Do not
  introduce a display face.

## 4. Component language

- Cards are white surfaces with a hairline border and 20px radius (`rounded-xl
  border border-line bg-surface`). Shadows are not the default language — the
  drawer is the one surface allowed a shadow because it overlays the app.
- **Buttons.** Primary: lime fill, ink text, `rounded-md`, opacity-down hover.
  Secondary/ghost: text-muted → text-ink hover, or a hairline border. Disabled
  states use opacity, not a new color.
- **Stat register.** One bordered container, figures side by side separated by
  hairlines, large number above its label with a small ink icon chip. Never
  four loose cards.
- **Capacity.** `CapacityStrip` (`components/ui/CapacityStrip.tsx`): one tick
  per slot — filled ticks solid ink, empty ticks hairline outlines — followed
  by a mono `filled / total` figure with the filled count marked in lime.
  Replaces any "2 / 4" text anywhere capacity is shown.
- **Drawer / sheet.** `components/ui/sheet.tsx` wraps Base UI's Dialog
  (focus trap, Escape, restore focus, no-flash exit via `data-starting-style`
  / `data-ending-style`). Only the notification drawer uses it; skin is A
  (surface, hairline left border, 12px left radius).
- **Skeletons.** One per route, mirroring the real page layout, built from
  `bg-placeholder` blocks. Never borrow another route's skeleton.
- **Feedback.** Toasts/inline states over alerts; modals open without a flash.

## 5. Motion

- Every animation is gated behind `prefers-reduced-motion: no-preference`;
  reduced-motion users see the static end state. Keyframes (`uf-card-in`,
  `uf-fade-in/out`, `uf-modal-in/out`) live in `app/globals.css`.
- The drawer: 200ms translate + opacity on `--uf-ease-out`, forwards in both
  directions so the exit never snaps.
- `.pressable` gives interactive elements a press affordance; the sidebar pill
  and accordion have their own reduced-motion-safe treatments.
- Motion is under 300ms, ease-out, and never animates a keyboard action.

## 6. Adopted patterns (from the AI rounds)

These four are now first-class parts of version A:

1. **Notifications drawer** (from round 2, "Card Catalog Drawer"): the fixed
   right rail became a slide-over opened from the TopBar bell. Read/unread
   behaviour is unchanged — the drawer renders the same
   `NotificationsPanel`, so marking, tabs and unread state are identical.
2. **Stat register** (from round 2): one bordered strip with hairline dividers
   instead of four separate stat cards. Values are still computed from the
   full project list, never the filtered one.
3. **Capacity strip + figures mono** (from round 1, "Studio Log"): capacity is
   a tick strip with a mono figure, and all figures in the app are Spline Sans
   Mono. Only the pattern was adopted — the palette and type of round 1 were
   not.
4. **Token discipline** (from round 1): hairline separated from muted text,
   one accent with one job, named tokens for every color (charcoal), status
   surfaces never hue-only.

## 7. Prohibitions

- Do not add a third fixed column to the shell. Notifications live in the
  drawer.
- Do not set a raw hex in a component — add a token.
- Do not use lime outside its job list in §2.
- Do not use the mono face for anything that is not a figure.
- Do not change the content column width (636px), the sidebar width, or the
  drawer width without changing the token.
- Do not reintroduce per-route notification bells; the TopBar owns the bell.
- Do not animate exits with ease-in, or any motion over ~300ms.
- Do not commit to `main`; this design lives on `ai-remix`.
