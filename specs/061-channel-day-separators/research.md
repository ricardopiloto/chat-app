# Research: 061-channel-day-separators

## R1 — Client-only vs server-side day markers

**Decision**: Pure frontend. Derive separators from already-loaded `Row.createdAt` / message timestamps. No API fields, no migrations.

**Rationale**: Spec FR-007 (presentation only); timestamps already exist; empty calendar days must not appear — client adjacency rule is sufficient.

**Alternatives considered**: Persist day markers as pseudo-messages — rejected (pollutes history, E2EE, permissions).

## R2 — Civil day key (timezone)

**Decision**: Use the **browser local timezone**. Day key = `YYYY-MM-DD` from local `getFullYear` / `getMonth` / `getDate` on `new Date(createdAt)`. Never invent keys for gaps between messages.

**Rationale**: FR-004; matches existing `toLocaleTimeString` usage in Channel.

**Alternatives considered**: UTC day — rejected (mismatches user clock). Explicit IANA tz preference — out of scope.

## R3 — Timeline vs sender grouping

**Decision**: Build a **timeline** of items before render:

1. Walk messages in chronological order.
2. When civil day key differs from previous message (or first message), emit a `day-separator` item for that key.
3. Group consecutive same-sender messages **only within the same day** into `msg-group` items (extend or replace current `groupMessages` so a day boundary always breaks a group).

**Rationale**: Spec wants separator before first message of each day; current `groupMessages` can merge same-sender across midnight and would hide the boundary.

**Alternatives considered**: Keep sender groups across days and inject separators inside groups — messier DOM/a11y. Virtualized day headers only — rejected (need inline dash lines).

## R4 — Label format (Hoje / Ontem / absolute)

**Decision**: Shared `formatDayLabel(dayKey | Date, now = new Date())`:

- Same local calendar day as `now` → `Hoje`
- Previous local calendar day → `Ontem`
- Else → `DD` (pad 2) + space + Portuguese month name (capitalized, e.g. `Setembro`) + space + `YYYY`

Month names: fixed `pt` array in the helper (product UI language), not necessarily full `Intl` locale if Mesa is PT-only today.

**Rationale**: Clarify session Q1 / FR-005.

**Alternatives considered**: Always absolute date — rejected in clarify. `Intl.RelativeTimeFormat` — less control over exact «Hoje»/«Ontem» strings.

## R5 — Sticky behaviour + anti-duplication

**Decision**:

- Overlay (or sticky region) at the **top of `.text-scroll`** showing the same label as the day currently “in view”.
- **Day in view**: civil day of content at the upper edge of the scrollport (last day whose inline separator has scrolled above the top, or intersecting message’s day).
- **Hide sticky** when the inline separator for that same day is intersecting / visible near the top of the scrollport (clarify Q4).
- Empty channel: no sticky, no inline.

Prefer **IntersectionObserver** on inline `.day-sep` elements (+ optional sentinel) over raw scroll math when possible; fall back to scroll listener if layout requires it.

**Rationale**: Clarify Q2–Q4 / FR-008.

**Alternatives considered**: Sticky-only (no inline) — rejected. Always-on sticky duplicating inline — rejected.

## R6 — Midnight / label freshness

**Decision**: When labels depend on “today”, schedule a refresh at next local midnight (or on `visibilitychange` / focus) so `Hoje`→`Ontem` and absolute dates update without full reload. Also recompute when `messages()` changes (WS append, pagination).

**Rationale**: FR-006; edge case in spec.

**Alternatives considered**: Only recompute on message change — stale overnight labels.

## R7 — Accessibility

**Decision**: Inline separator is a real text node (not CSS-only dashes); e.g. `<div class="day-sep" role="separator" aria-label="{label}">` with visible label. Sticky: hide from a11y tree when not shown; when shown alone, expose label without assertive live region on every scroll tick.

**Rationale**: Spec assumptions on announceability; avoid duplicate announcements.

## R8 — Visual chrome

**Decision**: Inline: horizontal rule with centered label (CSS flex/grid + side lines), muted text, theme tokens for light/dark. Sticky: same textual label rules; compact bar with opaque/scrim background so messages don’t show through; may shorten dash decoration if needed.

**Rationale**: FR-002 / US3 / theme readability.

**Alternatives considered**: Chip-only sticky with different wording — rejected (same FR-005 labels).

## R9 — Backend / voice

**Decision**: No backend changes. Voice/video channels out of scope (text Channel page only).

**Rationale**: Spec assumptions.
