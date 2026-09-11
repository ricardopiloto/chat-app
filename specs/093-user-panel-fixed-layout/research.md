# Research: 093 User Panel Fixed Layout

**Feature**: [spec.md](./spec.md)  
**Date**: 2026-09-11

## R1 — Permanent stack vs 084 dynamic stack

**Decision**: Always apply the stacked two-row layout language; **delete** overflow-based `measureStack` / `ResizeObserver` hysteresis that toggles `user-panel--stacked`.

**Rationale**: Spec FR-001/FR-002/FR-009 explicitly supersede 084’s move-icons-when-crowded behavior. Keeping measure code would fight the product rule.

**Alternatives considered**:
- Keep measure but force `stacked=true` always → dead code; reject.
- Always stacked only while `voice.live()` → rejects idle permanent layout; reject.

## R2 — Collapse empty upper row

**Decision**: When `.user-panel-calls` has no visible control children, hide/collapse that row (CSS `:has()` or Solid class when no visible controls). Do not reserve in-call upper-row height.

**Rationale**: Clarify Option B / FR-011. Today mic/deafen/cam are usually always visible, so collapse may be rare—still required for correctness when the set is empty.

**Alternatives considered**:
- Always reserve upper band → rejected by clarify.
- Move leftover icons beside name when empty upper → rejected (FR-001).

## R3 — Channel label source

**Decision**:
- If `voice.live()` → show `voice.channelName()` (call’s voice channel; already set on join in `VoiceSession`).
- Else → show **open/selected** channel **display name** from shell (Sidebar already knows `activeChannelId` + `channels()`).
- Else → empty string / omit node.

**Rationale**: Clarify Option C. Avoid UserPanel fetching channels; pass `openChannelName: string | null` from `Sidebar` into `UserPanel`.

**Alternatives considered**:
- Always route channel even while live → rejected (must prefer call channel).
- UserPanel re-fetches channel by id → extra API; unnecessary while Sidebar has list.

## R4 — Label interaction and format

**Decision**: Render as non-interactive text (e.g. `<span>`), not a link/button. Text = channel **name only** (no mandatory `#` / type icon). Truncate with ellipsis; do not crush handle below usable width or push Settings off.

**Rationale**: Clarify Options A/A. SC-007 references **FR-010** (label not clickable)—FR-010 is implied by clarify but missing as a numbered FR in `spec.md`; treat as required and add in implement/tasks or a small spec fix: *“Channel label MUST NOT navigate or open chrome.”*

**Alternatives considered**: Click navigates to channel → rejected. Prefix with `#` always → rejected as mandatory.

## R5 — DOM / CSS structure

**Decision**: Lower row becomes three zones: identity | channel label | Settings. Upper row: calls group full width, centered. Keep Settings outside identity button so label is not inside the account-open control.

**Suggested grid (stacked always)**:
```text
row1: [ calls ………………… ]     (hidden if no visible controls)
row2: [ identity ][ channel… ][ settings ]
```

**Rationale**: Matches stacked visual language; label sits in the “empty” space between name and Settings per spec.

**Alternatives considered**: Put label inside `.user-panel-status` → mixes status with channel; harder truncation priority. Reject for clarity.

## R6 — Backend

**Decision**: No backend/API/schema changes.

**Rationale**: Names already available client-side (`VoiceSession.channelName`, channel list in Sidebar).

## R7 — Relation to 092 Mesa à Vela

**Decision**: 093 is layout/behavior; visual tokens remain whatever skin is active. Do not block 093 on 092. If 092 lands later, restyle `.user-panel-channel` via tokens only.

**Rationale**: Specs are independent; 093 supersedes 084 stacking regardless of theme.

## Open items deferred to implement

- Exact CSS min widths for handle vs channel ellipsis priority (handle + Settings first).
- Optional `aria-label` for the channel context region (i18n).
- Add explicit **FR-010** line to `spec.md` if still missing when implementing (SC-007 already requires it).
