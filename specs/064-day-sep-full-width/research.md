# Research: 064-day-sep-full-width

## R1 — Why inline dash lines stop mid-panel today

**Decision**: Treat the root cause as **DOM containment**: `.day-sep` lives inside `.text-measure { max-width: 74ch }` in `Channel.tsx`, so flex lines only span the message column even though `.text-scroll` is wider.

**Rationale**: Confirmed in current markup (`text-scroll` → sticky host → `text-measure` → `For` with `.day-sep` + `.msg-group`). CSS on `.day-sep-line { flex: 1 }` cannot exceed the 74ch parent.

**Alternatives considered**:
- Negative margins / `width: 100vw` breakout from inside `.text-measure` — fragile with padding/scrollbar; easy to cause horizontal scroll (violates FR-005).
- Widen `.text-measure` — would widen messages (violates FR-004 / US2).

## R2 — How to make inline separators full content-width

**Decision**: Restructure so **day separators are not inside the 74ch measure**:

1. Remove the single outer `.text-measure` wrapper around the whole timeline **or** stop wrapping separators in it.
2. Apply reading-column constraint to messages only (e.g. `.msg-group` / inner measure wrapper with `max-width: 74ch`, or keep `.text-measure` only around consecutive message blocks).
3. `.day-sep` becomes a direct (or full-width) child of the scroll content box → width = content width of `.text-scroll` **inside** existing `padding: … 24px` (FR-001).

Preferred minimal approach:

- `For` each timeline item at the `.text-scroll` content level.
- `day-separator` → `.day-sep` (full width of content area).
- `msg-group` → wrap in `.text-measure` (or give `.msg-group` the `max-width: 74ch`).

**Rationale**: Matches clarify («dentro do padding lateral habitual»); keeps message column unchanged; lines resize with panel (FR-006) via normal block layout.

**Alternatives considered**: CSS grid on `.text-scroll` with full-bleed row tracks — more complex than needed. Absolute-positioned lines — hard with scroll/height.

## R3 — Sticky flush to top of scroll area

**Decision**: Correct vertical detachment without changing sticky show/hide logic (061):

Observed offsets today:

- `.text-scroll { padding: 20px 24px }` — sticky host participates in padded content flow.
- `.day-sep-sticky { padding: 4px 0 10px; top: 0 }` — explicit **4px** top padding lifts the chip visually.

Plan:

1. Keep chip/pill (`.day-sep-sticky-label`); **no** full-width dash on sticky (FR-008).
2. Set sticky overlay flush: `top: 0`, **zero** top padding on the sticky bar (bottom padding/scrim OK for fade over messages).
3. If padded scroll still leaves a gap at rest or while stuck, pull the host into the top padding band (e.g. negative `margin-top` equal to padding-top, and compensate first content spacing so messages don’t jump) **or** move vertical padding off `.text-scroll` onto message/composer-adjacent content only, keeping **horizontal** padding for FR-001.

Do **not** change IntersectionObserver / hide-when-inline-at-top rules in `Channel.tsx` except if DOM move of `.day-sep` requires selector updates (still `.day-sep`).

**Rationale**: Clarify Q sticky = align to top of message scroll box; style stays compact chip.

**Alternatives considered**: `position: absolute` fixed overlay on `.text-scroll` — always flush but duplicates 061 sticky semantics; only use if sticky+padding cannot be made flush cleanly.

## R4 — No logic changes in daySeparators.ts

**Decision**: Keep `buildTimelineItems` / labels / day keys as in 061. This feature is presentation only (FR-003).

**Rationale**: Spec success = visual; SC-003 requires 061 checklist still valid.

**Alternatives considered**: Server-side width hints — N/A.

## R5 — Themes and overflow

**Decision**: Reuse existing line/label colors (`--muted` mixes). Ensure `.day-sep` width is `100%` of content box (not `100vw`); `overflow-x` stays none on `.text-scroll`.

**Rationale**: FR-005, SC-002, SC-004.

**Alternatives considered**: Decorative glow / thicker bars — out of scope.
