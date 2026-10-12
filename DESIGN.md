# Design

<!-- Underflow — AI redesign (branch `ai-redesign`). Presentation layer only.
     Data, routes, copy, and behaviour are inherited from `main` unchanged. -->

## Direction

**Studio Log — the engineering computation pad.**

A student's workbench log: pale-green ruled computation paper, heavy graphite
entries, a red margin rule down the left of every column, blue ballpoint
annotations in the margin, a stamped entry number in each corner, and tabs
along the binding edge. The light is fluorescent studio light, so the paper
reads cool green rather than cream.

The world is the student engineer's *working instrument*, not a costume: the
ruled grid measures capacity, the margin rule carries annotation, the entry
number orders everything, the tab edge is navigation. Nothing decorative is
borrowed — no fake ledger tables, no instrument bezels, no terminal prompt.

### Why not the alternatives

The roll dealt six catalog challengers. Two were weighed seriously and
declined; each donated one discipline:

- **Boarding pass + live gate board** — competitive on product clarity (a
  board that reranks in place, a change that stays lit until noticed). Its
  weakness is that it wants to own the layout. *Donated discipline:*
  **persistent change state** — a status that moved stays marked until seen.
  Adopted for the My Collaborations board.
- **Midnight transit diagram** — competitive on audience identification
  (wayfinding, disciplined 45°/90° bends). Declined: it wants to own the
  navigation model. *Donated discipline:* **the chosen line burns brightest** —
  one active entry is unmistakable while the rest stay legible. Adopted for
  sidebar and filters.
- Declined outright: exposure record, Emigre bitmap specimen, orienteering
  map, Saville catalog sleeve — each loses on both axes here (a printer's
  tonal ramp, a type specimen, a terrain language, and a label-free catalog
  each obstruct the task a student is doing).

The category default for a student hub is rounded white cards on a grey
ground with one accent and a soft shadow. This direction refuses that
arrangement: the ground is a ruled sheet, the card is a laid-on sheet with a
square corner and a stamped entry number, and the accent is a margin rule
that means "attention", not decoration.

## Palette

Named roles, all doing real jobs.

| Token | Hex | Role |
|---|---|---|
| `--uf-paper` | `#E8EDE1` | Ground — the ruled pad the whole app sits on |
| `--uf-card` | `#F7F8F3` | A fresh sheet laid on the pad (cards, panels, inputs) |
| `--uf-ink` | `#1B1E19` | Graphite — primary text, full-weight rules, the sidebar rail |
| `--uf-pencil` | `#6C7268` | Graphite-light — secondary text, metadata, placeholder |
| `--uf-rule` | `#C3CEB6` | The ruled grid hairline and every divider |
| `--uf-margin` | `#C2402F` | Margin rule — attention, live status, destructive |
| `--uf-ink-blue` | `#2E5AAC` | Ballpoint — selection, active nav, links, filters on |
| `--uf-mark` | `#E4E24E` | Highlighter — the slot capacity figure, the one emphasised number |
| `--uf-mist` | `#D5DBCB` | Filled-block placeholder inside photos and skeletons |

Rules: `--uf-margin` is never decoration — it appears only where something
needs attention. `--uf-mark` marks exactly one kind of number (capacity).
`--uf-ink-blue` owns selection and nothing else. Ground and card are the only
large fields; a third large field appears only in the sidebar rail.

## Type

Two faces, both loaded through `next/font/google` (self-hosted at build):

- **Archivo** — everything structural. UI, headings, buttons, labels, card
  titles, body. Weights 400 / 500 / 600 / 700. Chosen because this is an
  operate surface and Archivo is a dense workhorse grotesk with engineering
  character, not a display face with an attitude; its tight, flat forms hold
  up at 11px labels and at 44px headings without a second family.
- **Spline Sans Mono** — figures only. Entry numbers, slot counts, dates,
  percentages, counts in stat cards, the capacity figure. Never prose. A mono
  is the right face for a column of figures that must align; it is not used as
  a decorative "technical" texture.

Scale (desktop-first): `44 / 32 / 24 / 18 / 16 / 14 / 12 / 11`.
Line height 1.15 on display, 1.5 on body. Labels are 11px, weight 600,
letter-spacing 0.06em, **sentence case** — never all-caps eyebrows.
Space above a heading is always greater than below it (1.5× rule).

## Surface & structure

- Square corners on sheets: `--uf-radius-sm: 2px`, `md: 3px`, `lg: 4px`.
  Pills only where the incumbent semantics are a pill (status tags, avatars,
  the icon toolbar) — `--uf-radius-pill: 999px`.
- Depth comes from the paper metaphor: a sheet is separated from the pad by a
  **1px `--uf-rule` border plus a 2px offset shadow** of graphite at 6%
  opacity (a sheet's edge, not a soft blur). No soft grey `rgba(0,0,0,.1)`
  blur, no gradient washes.
- The ground carries a faint ruled grid: horizontal hairlines every 24px via
  `repeating-linear-gradient` at low alpha. The content column carries the
  **margin rule** as a 1px vertical line inset from its left edge.
- Widths stay as the incumbent: rail `246px`, content `636px`, panel `308px`.

## Motion

One orchestrating idea: **the log fills in**. Entries arrive on the pad; a
capacity strip draws itself; the margin rule is simply there, never animated.

| Moment | Motion | Duration / easing |
|---|---|---|
| Page enter | One fade + 6px rise on the whole column (single block, not per-card stagger) | 320ms, `--uf-ease-out` |
| Capacity strip | Tick boxes fill left→right with 30ms stagger | 260ms each, `--uf-ease-out` |
| Like | Heart pop overshoot on like only; unlike is instant | 380ms, spring `cubic-bezier(0.23,1,0.32,1)` |
| Modal / lightbox | Fade + scale in; exit faster than entry **with `forwards` fill** | in 280ms / out 180ms |
| Accordion | `grid-template-rows` 0fr→1fr (layout, occasional toggle only) | 300ms |
| Nav pill | `transform` + `opacity` only (compositor) | 350ms |
| Status change | The moved row holds a margin hairline until observed | 900ms hold |

Easing: one token, `--uf-ease-out: cubic-bezier(0.23, 1, 0.32, 1)`. No ease-in
on exits.

**When NOT to animate:** never on hover of a card (no per-card hover motion,
no tilt, no lift-and-shadow), never on filter/search results replacing the
grid, never on text, never on scroll, never more than one thing at once during
page enter. Interaction feedback is a colour change, not a movement, except
where listed above.

## Component language

- **Sheet** — the base container: `--uf-card`, 1px `--uf-rule`, `lg` radius,
  2px offset graphite shadow.
- **Entry number** — a small mono figure in the sheet's top-left, in
  `--uf-pencil`, preceding every repeating item. It is what makes the page read
  as a log rather than a grid.
- **Capacity strip** — the signature. Slot budget as ruled tick boxes plus the
  count in `--uf-mark` on graphite. Used everywhere a project's capacity
  appears.
- **Status tag** — pill, hairline border, a 6px dot, sentence case. Colours:
  not-started `--uf-pencil`, pending `--uf-ink-blue`, complete `--uf-ink`,
  revise `--uf-margin`.
- **Controls** — real web controls with the world's type and palette: solid
  graphite button for primary, hairline button for secondary, input as a laid
  sheet with a rule-coloured border and an `--uf-ink-blue` focus ring. No
  world costume: no bevels, no ruled-paper fields standing in for tables.
- **Icons** — Boxicons, unchanged set and names from the incumbent.

## Bans (self-imposed)

No cream ground with a serif display. No near-black plus one neon accent. No
soft-blur drop shadow. No gradient decoration. No all-caps eyebrow above every
heading. No numbered markers `01 / 02 / 03` except entry numbers, which are a
real sequence. No middle-dot meta strings. No `→` appended to buttons. No
rounded-2xl white card. No per-card hover lift.