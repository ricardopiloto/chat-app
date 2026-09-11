# Research: 084-user-panel-stack

## R1 — Stack trigger: measure min name width (not icon count)

**Decision**: Activate stacked layout when a **single-row** arrangement would leave `.user-panel-handle` below a CSS-defined **minimum readable width** (default **`6ch`** at the panel handle font size, exposed as `--user-panel-name-min: 6ch`). Use layout measurement (`ResizeObserver` on the panel + optional handle element), not “≥ N icons” or “always when `voice.live()`”.

**Rationale**: Spec FR-002 / clarification — product rule is readable-name floor; icon count is only an implementation proxy if needed for tests.

**Alternatives considered**:

| Option | Why rejected |
|--------|----------------|
| Always stack while in call | Clarification rejected; wastes vertical space for short names |
| Stack when ≥4 call icons | Fails long names with few icons / short names with many |
| Pure CSS container queries only | Hard to keep Settings on identity row and reparent call icons without measure or duplicate DOM |

**Hysteresis**: Unstack only when available name width exceeds min + small buffer (e.g. **+1.5ch**) to avoid flicker at the boundary.

---

## R2 — DOM / CSS composition

**Decision**:

```text
.user-panel[.user-panel--stacked]
  ├─ .user-panel-actions     # leave, mic, deafen, cam, screen — NOT settings
  │     (stacked: full-width, justify center, row 1)
  │     (single: sits in main row after identity)
  └─ .user-panel-main          # identity | [actions if single] | settings
        ├─ .user-panel-identity
        └─ .user-panel-settings
```

Practical Solid approach (avoid duplicating button trees):

1. Keep **one** action-button tree (leave/mic/deafen/cam/screen).
2. Keep **Settings** as a sibling of identity in the **main** row always (FR-006).
3. When `stacked`: panel is `flex-direction: column`; actions row is first and `justify-content: center`; main row is identity + settings with `flex: 1` on identity.
4. When single-row: panel is `flex-direction: row`; actions sit between identity and settings (or after identity before settings—match today’s visual: identity | controls | settings).

**Rationale**: Clarifications — Settings on identity row; call controls centered above when stacked.

**Alternatives considered**: Absolute-position upper row over sidebar — **forbidden** (FR-010). Two copies of buttons with `Show` — works but higher drift risk; prefer one tree + CSS order/`display` if possible, or one tree moved via Solid portal-less conditional wrappers.

---

## R3 — Shell reflow (push layout up)

**Decision**: Rely on existing `.shell-nav` grid:

- `grid-template-rows: minmax(0, 1fr) auto`
- `.user-panel` → `grid-row: 2`, normal flow, **no** `position: absolute/fixed` for the stacked chrome

Growing panel content increases row-2 `auto` height; row-1 (`sidebar` / rail) shrinks via `minmax(0, 1fr)`. Do **not** overlay the channel list.

**Rationale**: FR-010 / SC-006; current CSS already supports this if panel height is content-driven.

**Verify in implement**: `.user-panel` has no fixed max-height that clips into overlay; sidebar keeps `min-height: 0` + internal scroll so list remains usable when panel grows.

**Alternatives considered**: Fixed panel height + internal scroll of icons — rejects readable stack UX. Floating panel over channels — explicit anti-goal.

---

## R4 — Minimum readable width constant

**Decision**: Ship `--user-panel-name-min: 6ch` on `.user-panel` (≈ six average characters of the handle font). Treat as the floor for “recognizable” truncation (FR-009 / SC-001). Adjust only if quickstart review shows still-unreadable stubs.

**Rationale**: Spec deferred exact px to plan; `ch` tracks font size; 6ch is a practical recognizable stub floor without demanding full long handles.

**Alternatives considered**: Fixed `72px` — less font-relative. `12ch` — may force stack too often on narrow panels.

---

## R5 — Backend / API / i18n

**Decision**: No backend, occupancy, or LiveKit changes. No required new user-facing strings; optional `aria` on the upper actions group can reuse `shell.callControls`.

**Rationale**: Spec assumptions.

---

## R6 — Relation to 078 / current panel

**Decision**: 078 Discord idle composition remains the **single-row** baseline. Current panel already includes leave / cam / screen share (post-078 evolution)—those move to the **upper** row when stacked; Settings stays with identity. Do not revert camera/screen off the panel as part of 084.

**Rationale**: Scope is overflow layout only (FR-005).
